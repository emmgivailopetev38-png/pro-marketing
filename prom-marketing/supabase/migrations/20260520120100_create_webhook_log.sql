create table public.cal_webhook_log (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  payload jsonb,
  signature_valid boolean not null,
  processed_at timestamptz not null default now(),
  error text
);

create index cal_webhook_log_processed_at_idx on public.cal_webhook_log (processed_at desc);

alter table public.cal_webhook_log enable row level security;

create policy "admins can select webhook log"
  on public.cal_webhook_log
  for select
  to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text));
