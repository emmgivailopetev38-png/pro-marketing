-- ─────────────────────────────────────────────────────────────────────────
-- ERP Фаза 3: Оферти → Проекти/Доставка.
--
-- offers   — какво сме предложили на контакт (статус пътека до accepted).
-- projects — какво СТРОИМ след приета оферта (или директно), със задачи.
-- Всичко е вързано към contact_id (философията на CRM-а) и идемпотентно
-- за Hermes през dedupe_key.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  description text,
  amount_net numeric(12, 2),
  amount_gross numeric(12, 2),
  vat_amount numeric(12, 2),
  currency text not null default 'EUR',
  original_amount numeric(12, 2),
  original_currency text,
  fx_rate numeric(12, 6),
  fx_source text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  sent_at timestamptz,
  valid_until date,
  accepted_at timestamptz,
  url text,
  source text not null default 'manual',
  notes text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists offers_dedupe_key
  on public.offers (dedupe_key) where dedupe_key is not null;
create index if not exists offers_contact_idx on public.offers (contact_id);
create index if not exists offers_status_idx on public.offers (status, created_at desc);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'waiting_client', 'done', 'cancelled')),
  amount_gross numeric(12, 2),
  currency text not null default 'EUR',
  started_at date,
  due_date date,
  done_at timestamptz,
  notes text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists projects_dedupe_key
  on public.projects (dedupe_key) where dedupe_key is not null;
create index if not exists projects_contact_idx on public.projects (contact_id);
create index if not exists projects_status_idx on public.projects (status, created_at desc);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  sort_order int not null default 0,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tasks_project_idx on public.project_tasks (project_id, sort_order);

-- updated_at триггери (set_updated_at вече съществува от CRM миграциите)
drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at before update on public.project_tasks
  for each row execute function public.set_updated_at();

-- RLS: service-role only (както останалите CRM таблици)
alter table public.offers enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
