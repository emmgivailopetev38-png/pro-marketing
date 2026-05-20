create extension if not exists "pgcrypto";

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  cal_booking_id text not null unique,
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  status text not null default 'confirmed',
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_scheduled_at_idx on public.bookings (scheduled_at desc);
create index bookings_email_idx on public.bookings (attendee_email);
create index bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

create policy "admins can select bookings"
  on public.bookings
  for select
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text));
