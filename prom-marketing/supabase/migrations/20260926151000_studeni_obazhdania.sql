-- Студените обаждания (26.09.2026).
-- Ивайло: „има в драфт клиенти за студени обаждания — въведи ги в системата,
-- сложи от София кои са първите, тя да има достъп до първите; при мен — всички“.
--
-- Отделна база, НЕ contacts. Картон в CRM-а се ражда едва при истински разговор
-- („говорихме“ или „записах среща“). Иначе студената фирма влиза в „Първо
-- обаждане“ и бута горещите лийдове от рекламите, а топлият кръг (warm-sequence
-- — всеки картон с имейл, който не е спечелен) започва да ѝ праща писма.
-- Само нови таблици: старият код не ги вижда, затова миграцията върви преди деплоя.

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  city text,
  area text,
  phone text,
  phone_key text,
  email text,
  website text,
  sector text,
  opener text,
  offer text,
  gaps text,
  email_subject text,
  email_draft text,
  decision_maker text,
  buying_signal text,
  score integer,
  tier text,
  batch text not null,
  priority integer not null default 100,
  assigned_to uuid references public.team_members(id) on delete set null,
  assigned_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'no_answer', 'callback', 'unreachable', 'not_interested', 'bad_number', 'converted')),
  attempts integer not null default 0,
  no_answers integer not null default 0,
  last_called_at timestamptz,
  next_call_at timestamptz,
  last_note text,
  contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.prospects is
  'Студени обаждания: фирми от проучването, на които още не сме говорили. Картон в contacts се прави при „говорихме“/„среща“ (contact_id).';
comment on column public.prospects.phone_key is 'Само цифрите с 359 отпред — за дедупликацията между пакетите и с contacts.';
comment on column public.prospects.priority is 'По-малко = по-напред в опашката. София = 1 (Ивайло), после градовете по брой фирми.';
comment on column public.prospects.batch is 'От кой пакет е дошла: gotovi-2026-09-26 (232 готови) / prouchen-2026-09-26 (проучените).';

create unique index if not exists prospects_phone_key_uniq on public.prospects (phone_key) where phone_key is not null;
create index if not exists prospects_queue_idx on public.prospects (assigned_to, status, priority);
create index if not exists prospects_city_idx on public.prospects (city);

create table if not exists public.prospect_calls (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  member_id uuid references public.team_members(id) on delete set null,
  caller text not null,
  outcome text not null,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.prospect_calls is 'Всяко натискане на студена карта: кой, какъв изход, бележка. Брои се в „Напредък“.';

create index if not exists prospect_calls_prospect_idx on public.prospect_calls (prospect_id, created_at desc);
create index if not exists prospect_calls_created_idx on public.prospect_calls (created_at desc);

alter table public.prospects enable row level security;
revoke all on public.prospects from anon, authenticated;
alter table public.prospect_calls enable row level security;
revoke all on public.prospect_calls from anon, authenticated;

-- Вкарването на пакет (POST /api/crm/prospects). Новата фирма се добавя; позната —
-- по телефон или, без телефон, по име и град — само се допълва: празните полета,
-- без да пипа състоянието, опитите и човека, при когото е. Безопасно за повторно пускане.
create or replace function public.import_prospects(p_rows jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r jsonb;
  k text;
  ins integer := 0;
  mer integer := 0;
begin
  for r in select value from jsonb_array_elements(p_rows) loop
    k := nullif(r->>'phone_key', '');
    if k is not null and exists (select 1 from public.prospects where phone_key = k) then
      update public.prospects set
        email = coalesce(email, nullif(r->>'email', '')),
        website = coalesce(website, nullif(r->>'website', '')),
        sector = coalesce(sector, nullif(r->>'sector', '')),
        area = coalesce(area, nullif(r->>'area', '')),
        opener = coalesce(opener, nullif(r->>'opener', '')),
        offer = coalesce(offer, nullif(r->>'offer', '')),
        gaps = coalesce(gaps, nullif(r->>'gaps', '')),
        email_subject = coalesce(email_subject, nullif(r->>'email_subject', '')),
        email_draft = coalesce(email_draft, nullif(r->>'email_draft', '')),
        decision_maker = coalesce(decision_maker, nullif(r->>'decision_maker', '')),
        buying_signal = coalesce(buying_signal, nullif(r->>'buying_signal', '')),
        score = coalesce(score, round(nullif(r->>'score', '')::numeric)::integer),
        tier = coalesce(tier, nullif(r->>'tier', '')),
        updated_at = now()
      where phone_key = k;
      mer := mer + 1;
    elsif k is null and exists (
      select 1 from public.prospects
      where lower(company) = lower(r->>'company') and coalesce(city, '') = coalesce(r->>'city', '')
    ) then
      mer := mer + 1;
    else
      insert into public.prospects (
        company, city, area, phone, phone_key, email, website, sector, opener, offer, gaps,
        email_subject, email_draft, decision_maker, buying_signal, score, tier, batch, priority
      ) values (
        r->>'company', nullif(r->>'city', ''), nullif(r->>'area', ''), nullif(r->>'phone', ''), k,
        nullif(r->>'email', ''), nullif(r->>'website', ''), nullif(r->>'sector', ''), nullif(r->>'opener', ''),
        nullif(r->>'offer', ''), nullif(r->>'gaps', ''), nullif(r->>'email_subject', ''), nullif(r->>'email_draft', ''),
        nullif(r->>'decision_maker', ''), nullif(r->>'buying_signal', ''), round(nullif(r->>'score', '')::numeric)::integer,
        nullif(r->>'tier', ''), coalesce(nullif(r->>'batch', ''), 'bez-paket'), coalesce(nullif(r->>'priority', '')::integer, 100)
      );
      ins := ins + 1;
    end if;
  end loop;
  return jsonb_build_object('inserted', ins, 'merged', mer);
end
$$;

revoke all on function public.import_prospects(jsonb) from public, anon, authenticated;
