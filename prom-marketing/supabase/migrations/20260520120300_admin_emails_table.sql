-- Table-backed admin allowlist
-- Replaces the GUC-based approach because Supabase managed Postgres
-- denies `alter database ... set` from the SQL editor.

create table if not exists public.admin_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;
-- No policies: only the security-definer function reads it.

create or replace function public.is_admin_email(email_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from public.admin_emails
      where lower(email) = lower(email_input)
    ),
    false
  );
$$;

-- Seed initial owner. Owner can add more emails via SQL editor:
--   insert into public.admin_emails (email) values ('other@example.com');
insert into public.admin_emails (email) values ('ivailopetev38@gmail.com')
  on conflict do nothing;
