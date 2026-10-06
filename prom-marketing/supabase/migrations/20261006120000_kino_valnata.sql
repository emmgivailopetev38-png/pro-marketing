-- ВЪЛНАТА · онлайн кино — проследяването в залата.
--
-- ⚠ САМО ФАЙЛ. Не е приложена на живо — прилага се след прегледа на Ивайло
--   (Supabase → SQL editor или `supabase db push`). Докато я няма, залата
--   върви: записването, билетът, плащането и CRM активностите не зависят от
--   нея. Без нея не се пишат само пулсовете (кривата на задържане) и kino_events.
--
-- kino_watch  — един ред на човек и прожекция: изгледани минути, най-далечна
--               позиция, режими (премиера / повторение), етапи (25/50/75 %…).
-- kino_events — реакции, въпроси, кликове, плащания, капара, разговори, бонус.
--
-- Сигурност: RLS е включен и НЯМА политики → anon и authenticated не виждат
-- нищо. Пише и чете само сървърът (service_role) през /api/kino/* и таблото.
-- Двете функции са SECURITY DEFINER само за service_role.

create table if not exists public.kino_watch (
  id uuid primary key default gen_random_uuid(),
  screening_id text not null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_mode text not null default 'premiere' check (first_mode in ('premiere', 'replay', 'live')),
  modes text[] not null default '{}',
  -- най-далечната секунда, до която е стигнал, докато филмът върви
  max_pos integer not null default 0 check (max_pos >= 0),
  -- гледани секунди (сбор от пулсовете, в които филмът върви)
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  -- изгледаните минути без повторения — от тях е процентът и кривата
  minutes smallint[] not null default '{}',
  beats integer not null default 0,
  -- пулсове със скрит таб (гледа ли наистина)
  hidden_beats integer not null default 0,
  -- entered · p25 · p50 · p75 · offer_chapter · end · bonus
  milestones text[] not null default '{}',
  user_agent text,
  unique (screening_id, contact_id)
);

create index if not exists kino_watch_screening_idx on public.kino_watch (screening_id, last_seen_at desc);

create table if not exists public.kino_events (
  id bigint generated always as identity primary key,
  screening_id text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  type text not null check (
    type in ('reaction', 'question', 'click', 'checkout', 'payment', 'deposit', 'booking', 'bonus', 'calc', 'survey', 'waitlist')
  ),
  value text,
  pos integer,
  minute smallint,
  amount_eur numeric(10, 2),
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kino_events_screening_type_idx on public.kino_events (screening_id, type, created_at desc);
create index if not exists kino_events_contact_idx on public.kino_events (contact_id);

alter table public.kino_watch enable row level security;
alter table public.kino_events enable row level security;
revoke all on table public.kino_watch from anon, authenticated;
revoke all on table public.kino_events from anon, authenticated;

-- ── Пулсът: една атомарна стъпка ──────────────────────────────────────────
-- Създава реда при първия пулс, добавя минутата (без повторение), вдига
-- най-далечната позиция и гледаните секунди — само ако филмът върви.
-- Две отворени вкладки не губят минута: редът се заключва (for update).
create or replace function public.kino_heartbeat(
  p_screening text,
  p_contact uuid,
  p_pos integer,
  p_delta integer,
  p_mode text,
  p_playing boolean,
  p_visible boolean,
  p_ua text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.kino_watch%rowtype;
  v_created boolean := false;
  v_pos integer := greatest(0, least(coalesce(p_pos, 0), 6 * 3600));
  v_minute smallint := (greatest(0, least(coalesce(p_pos, 0), 6 * 3600)) / 60)::smallint;
  v_mode text := case when p_mode in ('premiere', 'replay', 'live') then p_mode else 'replay' end;
begin
  insert into public.kino_watch (screening_id, contact_id, first_mode, modes, user_agent)
  values (p_screening, p_contact, v_mode, array[v_mode], left(p_ua, 300))
  on conflict (screening_id, contact_id) do nothing;
  v_created := found;

  select * into v_row
    from public.kino_watch
   where screening_id = p_screening and contact_id = p_contact
   for update;

  update public.kino_watch w set
    last_seen_at = now(),
    beats = w.beats + 1,
    hidden_beats = w.hidden_beats + case when coalesce(p_visible, true) then 0 else 1 end,
    modes = case when v_mode = any(w.modes) then w.modes else array_append(w.modes, v_mode) end,
    max_pos = case when p_playing then greatest(w.max_pos, v_pos) else w.max_pos end,
    watched_seconds = w.watched_seconds + case when p_playing then greatest(0, least(coalesce(p_delta, 0), 30)) else 0 end,
    minutes = case
      when p_playing and not (v_minute = any(w.minutes)) then array_append(w.minutes, v_minute)
      else w.minutes
    end
  where w.screening_id = p_screening and w.contact_id = p_contact
  returning * into v_row;

  return jsonb_build_object(
    'created', v_created,
    'max_pos', v_row.max_pos,
    'minutes', coalesce(array_length(v_row.minutes, 1), 0),
    'watched_seconds', v_row.watched_seconds,
    'milestones', to_jsonb(v_row.milestones)
  );
end;
$$;

-- ── Етапите: записват се веднъж ────────────────────────────────────────────
-- Връща САМО новите етапи (тези, които още ги нямаше) — по тях сървърът пише
-- активност в CRM-а. Две вкладки едновременно не правят два записа.
create or replace function public.kino_claim_milestones(
  p_screening text,
  p_contact uuid,
  p_names text[]
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text[];
  v_new text[];
begin
  select milestones into v_old
    from public.kino_watch
   where screening_id = p_screening and contact_id = p_contact
   for update;
  if not found then
    return '{}'::text[];
  end if;

  select coalesce(array_agg(distinct n), '{}'::text[]) into v_new
    from unnest(coalesce(p_names, '{}'::text[])) as n
   where not (n = any(v_old));

  if coalesce(array_length(v_new, 1), 0) > 0 then
    update public.kino_watch
       set milestones = v_old || v_new
     where screening_id = p_screening and contact_id = p_contact;
  end if;
  return v_new;
end;
$$;

revoke all on function public.kino_heartbeat(text, uuid, integer, integer, text, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.kino_claim_milestones(text, uuid, text[]) from public, anon, authenticated;
grant execute on function public.kino_heartbeat(text, uuid, integer, integer, text, boolean, boolean, text) to service_role;
grant execute on function public.kino_claim_milestones(text, uuid, text[]) to service_role;
