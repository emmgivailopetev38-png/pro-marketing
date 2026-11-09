-- ─────────────────────────────────────────────────────────────────────────
-- 🇪🇺 Евро проекти (10.11.2026): програмите за финансиране (ЕС/национални),
-- които следим, и кои контакти от CRM-а могат да кандидатстват по тях.
-- Пълни ги автоматичната задача през /api/crm/finansirane/*; статусът на
-- съвпадението (nov → kazano → interes → kandidatstva → spechelen / ne) е на Ивайло.
-- Само добавяне — нищо не се трие.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.funding_programs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text check (
    category is null or category in (
      'bg_es_fondove', 'pvu', 'az', 'dfz_psp', 'es_direktno', 'trangranichni', 'finansovi_instrumenti', 'drugi'
    )
  ),
  operator text,
  program text,
  url text,
  status text not null default 'upcoming' check (status in ('open', 'upcoming', 'rolling', 'closed')),
  open_date date,
  deadline date,
  deadline_note text,
  budget_text text,
  grant_text text,
  beneficiaries text,
  eligible_costs text,
  our_role text check (our_role is null or our_role in ('kandidat', 'izpalnitel', 'partnior', 'konsultant')),
  our_services text[],
  client_profile text,
  for_us boolean default false,
  for_us_reason text,
  priority int default 3,
  notes text,
  sources jsonb default '[]'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.funding_programs is '🇪🇺 Евро проекти — програмите за финансиране, които следим (key = латиница, upsert от задачата)';
comment on column public.funding_programs.priority is '1 = най-важна';
comment on column public.funding_programs.for_us is 'ProMarketing кандидатства сама';

create index if not exists funding_programs_status_deadline_idx on public.funding_programs (status, deadline);

drop trigger if exists funding_programs_set_updated_at on public.funding_programs;
create trigger funding_programs_set_updated_at before update on public.funding_programs
  for each row execute function public.set_updated_at();

alter table public.funding_programs enable row level security;

create table if not exists public.funding_matches (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.funding_programs(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  fit int check (fit is null or (fit between 0 and 100)),
  role text,
  reason text,
  next_step text,
  status text not null default 'nov' check (status in ('nov', 'kazano', 'interes', 'kandidatstva', 'spechelen', 'ne')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, contact_id)
);

comment on table public.funding_matches is '🇪🇺 Кой контакт по коя програма може да кандидатства; status го сменя Ивайло';

create index if not exists funding_matches_contact_idx on public.funding_matches (contact_id);
create index if not exists funding_matches_program_idx on public.funding_matches (program_id);

drop trigger if exists funding_matches_set_updated_at on public.funding_matches;
create trigger funding_matches_set_updated_at before update on public.funding_matches
  for each row execute function public.set_updated_at();

alter table public.funding_matches enable row level security;
