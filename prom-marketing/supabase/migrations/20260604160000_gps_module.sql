-- ─────────────────────────────────────────────────────────────────────────
-- GPS module (operations, separate from sales CRM): device-level tracking +
-- install / uninstall / move history. Billing stays in recurring_services.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.gps_devices (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  recurring_service_id uuid references public.recurring_services(id) on delete set null,
  label text,
  imei text,
  sim text,
  vehicle_plate text,
  vehicle_model text,
  monthly_fee numeric(12, 2),
  currency text not null default 'EUR',
  status text not null default 'active'
    check (status in ('active', 'paused', 'removed', 'moved')),
  installed_at date,
  removed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists gps_devices_imei_key on public.gps_devices (imei) where imei is not null;
create index if not exists gps_devices_contact_idx on public.gps_devices (contact_id);
create index if not exists gps_devices_status_idx on public.gps_devices (status);

create table if not exists public.gps_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.gps_devices(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  event_type text not null
    check (event_type in ('install', 'uninstall', 'move', 'swap', 'service', 'pause', 'resume', 'other')),
  event_date date,
  from_vehicle text,
  to_vehicle text,
  price numeric(12, 2),
  currency text not null default 'EUR',
  technician text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists gps_events_device_idx on public.gps_events (device_id, created_at desc);
create index if not exists gps_events_contact_idx on public.gps_events (contact_id);

drop trigger if exists gps_devices_set_updated_at on public.gps_devices;
create trigger gps_devices_set_updated_at before update on public.gps_devices
  for each row execute function public.set_updated_at();

alter table public.gps_devices enable row level security;
alter table public.gps_events enable row level security;

drop policy if exists "admins manage gps_devices" on public.gps_devices;
create policy "admins manage gps_devices" on public.gps_devices for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

drop policy if exists "admins manage gps_events" on public.gps_events;
create policy "admins manage gps_events" on public.gps_events for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'gps_devices') then
    alter publication supabase_realtime add table public.gps_devices;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'gps_events') then
    alter publication supabase_realtime add table public.gps_events;
  end if;
end$$;
