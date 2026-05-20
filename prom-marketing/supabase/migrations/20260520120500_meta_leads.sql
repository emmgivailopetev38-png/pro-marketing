-- Meta Lead Ads → site mirror.
-- Leads arrive via Meta Lead Center → Google Sheets sync → our cron job
-- reads the published CSV URL → upserts here. Optional manual webhook
-- import also writes through the same upsert.

create table if not exists public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  meta_lead_id text not null unique,
  form_id text not null,
  form_name text,
  campaign_id text,
  campaign_name text,
  ad_id text,
  ad_name text,
  full_name text,
  email text,
  phone text,
  field_data jsonb,
  source text not null default 'google_sheets',
  raw_payload jsonb,
  imported_at timestamptz not null default now(),
  created_time timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists meta_leads_created_time_idx on public.meta_leads (created_time desc);
create index if not exists meta_leads_form_id_idx on public.meta_leads (form_id);
create index if not exists meta_leads_email_idx on public.meta_leads (email);
create index if not exists meta_leads_imported_at_idx on public.meta_leads (imported_at desc);

alter table public.meta_leads enable row level security;

drop policy if exists "admins can select meta_leads" on public.meta_leads;
create policy "admins can select meta_leads"
  on public.meta_leads
  for select
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text));

-- Configured Google Sheet sources, one per Meta lead form.
create table if not exists public.meta_lead_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  source_type text not null default 'google_sheet',
  csv_url text not null,
  form_id text,
  added_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_sync_count integer not null default 0,
  last_sync_error text,
  enabled boolean not null default true
);

alter table public.meta_lead_sources enable row level security;
drop policy if exists "admins can select sources" on public.meta_lead_sources;
create policy "admins can select sources"
  on public.meta_lead_sources
  for select
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text));
