-- Unified client dashboard: contacts + activities timeline.
-- Aggregates Meta leads, Cal.com bookings, sent emails, and manual entries
-- into a single source-of-truth for "who have we engaged and where are we
-- with them right now".

-- Stage enum: a deliberately tiny sales pipeline.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contact_stage') then
    create type public.contact_stage as enum (
      'lead',         -- raw form fill, no contact yet
      'contacted',    -- we've reached out
      'discovery',    -- discovery call scheduled or done
      'offer_sent',   -- proposal / oferta sent
      'negotiating',  -- back-and-forth on terms
      'won',          -- closed-won
      'lost'          -- closed-lost / unresponsive
    );
  end if;
end$$;

-- One row per unique person we know about.
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text unique,
  phone text,
  company text,
  stage public.contact_stage not null default 'lead',
  source text not null default 'manual',  -- 'meta_lead', 'cal_booking', 'email', 'manual'
  source_ref text,                        -- meta_lead_id, cal_booking_id, etc.
  notes text,
  deal_value_eur integer,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_stage_idx on public.contacts (stage);
create index if not exists contacts_updated_at_idx on public.contacts (updated_at desc);
create index if not exists contacts_email_idx on public.contacts (email);
create index if not exists contacts_phone_idx on public.contacts (phone);

-- Timeline of everything that's happened with a contact.
create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  activity_type text not null,    -- 'meta_lead', 'booking', 'email_sent', 'call', 'note', 'stage_change'
  title text not null,
  body text,
  occurred_at timestamptz not null default now(),
  metadata jsonb,
  created_by text,                -- admin email who logged it
  created_at timestamptz not null default now()
);

create index if not exists contact_activities_contact_idx on public.contact_activities (contact_id, occurred_at desc);
create index if not exists contact_activities_type_idx on public.contact_activities (activity_type);
create index if not exists contact_activities_occurred_at_idx on public.contact_activities (occurred_at desc);

-- Keep contacts.updated_at fresh.
create or replace function public.touch_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row
  execute function public.touch_contacts_updated_at();

-- When a new activity is logged, bump the parent contact so the list view
-- can sort by "last activity" without a join.
create or replace function public.bump_contact_on_activity()
returns trigger
language plpgsql
as $$
begin
  update public.contacts set updated_at = now() where id = new.contact_id;
  return new;
end$$;

drop trigger if exists contact_activities_bump_parent on public.contact_activities;
create trigger contact_activities_bump_parent
  after insert on public.contact_activities
  for each row
  execute function public.bump_contact_on_activity();

-- RLS — admins can do everything via authenticated session,
-- service role obviously bypasses.
alter table public.contacts enable row level security;
alter table public.contact_activities enable row level security;

drop policy if exists "admins manage contacts" on public.contacts;
create policy "admins manage contacts"
  on public.contacts
  for all
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

drop policy if exists "admins manage activities" on public.contact_activities;
create policy "admins manage activities"
  on public.contact_activities
  for all
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

-- ---------------------------------------------------------------------
-- BACKFILL: import existing meta_leads + bookings.
-- Each row in the source tables becomes one contact (de-duped by email,
-- with phone as a fallback key for emailless leads), plus one initial
-- activity capturing where they came from.
-- ---------------------------------------------------------------------

-- meta_leads → contacts (newest record wins on conflict)
insert into public.contacts (full_name, email, phone, stage, source, source_ref, created_at)
select distinct on (lower(coalesce(nullif(email, ''), 'phone:' || coalesce(phone, ''))))
  full_name,
  nullif(email, ''),
  nullif(phone, ''),
  'lead'::public.contact_stage,
  'meta_lead',
  meta_lead_id,
  coalesce(created_time, imported_at, created_at)
from public.meta_leads
where coalesce(nullif(email, ''), nullif(phone, '')) is not null
order by lower(coalesce(nullif(email, ''), 'phone:' || coalesce(phone, ''))),
         coalesce(created_time, imported_at, created_at) desc
on conflict (email) do nothing;

-- meta_leads → activities (one per source row)
insert into public.contact_activities (contact_id, activity_type, title, body, occurred_at, metadata)
select
  c.id,
  'meta_lead',
  coalesce('Meta lead · ' || nullif(ml.form_name, ''), 'Meta lead'),
  coalesce('Кампания: ' || nullif(ml.campaign_name, ''), null),
  coalesce(ml.created_time, ml.imported_at, ml.created_at),
  jsonb_build_object(
    'meta_lead_id', ml.meta_lead_id,
    'form_id', ml.form_id,
    'campaign_id', ml.campaign_id,
    'ad_id', ml.ad_id,
    'source', ml.source
  )
from public.meta_leads ml
join public.contacts c
  on (ml.email is not null and ml.email <> '' and c.email = ml.email)
  or (c.phone = ml.phone and (ml.email is null or ml.email = ''))
where not exists (
  select 1 from public.contact_activities ca
  where ca.contact_id = c.id
    and ca.activity_type = 'meta_lead'
    and ca.metadata->>'meta_lead_id' = ml.meta_lead_id
);

-- bookings → contacts (upsert by attendee_email; bump stage to 'discovery')
insert into public.contacts (full_name, email, phone, stage, source, source_ref, created_at)
select distinct on (lower(b.attendee_email))
  b.attendee_name,
  b.attendee_email,
  nullif(b.attendee_phone, ''),
  'discovery'::public.contact_stage,
  'cal_booking',
  b.cal_booking_id,
  b.created_at
from public.bookings b
order by lower(b.attendee_email), b.created_at desc
on conflict (email) do update
  set stage = case
    when public.contacts.stage in ('lead', 'contacted') then 'discovery'::public.contact_stage
    else public.contacts.stage
  end,
  phone = coalesce(public.contacts.phone, excluded.phone),
  full_name = coalesce(public.contacts.full_name, excluded.full_name);

-- bookings → activities
insert into public.contact_activities (contact_id, activity_type, title, body, occurred_at, metadata)
select
  c.id,
  'booking',
  'Cal.com среща — ' || to_char(b.scheduled_at at time zone 'Europe/Sofia', 'DD.MM HH24:MI'),
  null,
  b.created_at,
  jsonb_build_object(
    'cal_booking_id', b.cal_booking_id,
    'scheduled_at', b.scheduled_at,
    'duration_minutes', b.duration_minutes,
    'status', b.status
  )
from public.bookings b
join public.contacts c on c.email = b.attendee_email
where not exists (
  select 1 from public.contact_activities ca
  where ca.contact_id = c.id
    and ca.activity_type = 'booking'
    and ca.metadata->>'cal_booking_id' = b.cal_booking_id
);

-- Enable Supabase realtime for live dashboard updates.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'contacts'
  ) then
    alter publication supabase_realtime add table public.contacts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'contact_activities'
  ) then
    alter publication supabase_realtime add table public.contact_activities;
  end if;
end$$;
