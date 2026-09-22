-- Екип v3 (22.09.2026): бележки за системата + индекс за срещите.
-- Приложена в Supabase на 22.09.2026 през MCP (apply_migration ekip_v3_system_notes_noshow).

-- Бележки за системата и процесите: всеки от екипа пише, собственикът преглежда.
create table if not exists public.system_notes (
  id uuid primary key default gen_random_uuid(),
  author_key text not null,              -- 'owner' или team_members.id
  author_name text not null,
  area text not null default 'crm',      -- crm | process | idea | bug | other
  text text not null,
  status text not null default 'new',    -- new | seen | done | dismissed
  owner_reply text,
  page text,                             -- от кой екран е писана (href)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists system_notes_status_idx on public.system_notes (status, created_at desc);
create index if not exists system_notes_author_idx on public.system_notes (author_key, created_at desc);
alter table public.system_notes enable row level security;
-- Индекс за проверката „срещи за вчера без резултат“ и за напомнянията по Viber.
create index if not exists bookings_scheduled_status_idx on public.bookings (scheduled_at, status);
