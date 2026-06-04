-- ─────────────────────────────────────────────────────────────────────────
-- CRM expansion: expenses, documents (+OCR data), Meta ads reports,
-- automation events. Hermes-facing tables + the read summaries.
-- Mirrors the existing accounting layer: RLS via is_admin_email, service role
-- writes through /api/crm/*, idempotency via dedupe_key partial unique indexes.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. expenses (разходи към доставчици) ──────────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  supplier_name text,
  category text not null default 'other'
    check (category in ('accountant', 'hosting', 'ads', 'gps_hardware', 'software', 'office', 'salary', 'tax', 'bank_fee', 'other')),
  description text,
  invoice_number text,
  amount_net numeric(12, 2),
  amount_gross numeric(12, 2),
  vat_amount numeric(12, 2),
  currency text not null default 'EUR',
  expense_date date,
  due_date date,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'paid', 'partially_paid', 'cancelled')),
  source text not null default 'manual'
    check (source in ('manual', 'gmail', 'accountant_email', 'hermes', 'uploaded_pdf', 'bank_statement')),
  source_email_id text,
  document_id uuid,
  notes text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists expenses_source_email_id_key on public.expenses (source_email_id) where source_email_id is not null;
create unique index if not exists expenses_dedupe_key_key on public.expenses (dedupe_key) where dedupe_key is not null;
create index if not exists expenses_status_idx on public.expenses (status);
create index if not exists expenses_date_idx on public.expenses (expense_date desc);
create index if not exists expenses_contact_idx on public.expenses (contact_id);

-- ── 2. documents (PDF/снимки/талони/извлечения + OCR данни) ────────────────
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  expense_id uuid references public.expenses(id) on delete set null,
  doc_type text not null default 'other'
    check (doc_type in ('invoice', 'proforma', 'receipt', 'bank_statement', 'contract', 'photo', 'gps_protocol', 'other')),
  title text,
  file_name text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  ocr_text text,
  extracted jsonb,
  match_status text not null default 'unmatched'
    check (match_status in ('matched', 'unmatched', 'ambiguous', 'ignored')),
  match_confidence text check (match_confidence is null or match_confidence in ('low', 'medium', 'high')),
  source text not null default 'hermes'
    check (source in ('hermes', 'upload', 'gmail', 'accountant_email', 'bank_statement')),
  source_email_id text,
  notes text,
  dedupe_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists documents_source_email_id_key on public.documents (source_email_id) where source_email_id is not null;
create unique index if not exists documents_dedupe_key_key on public.documents (dedupe_key) where dedupe_key is not null;
create index if not exists documents_contact_idx on public.documents (contact_id);
create index if not exists documents_invoice_idx on public.documents (invoice_id);
create index if not exists documents_match_status_idx on public.documents (match_status);
create index if not exists documents_type_idx on public.documents (doc_type);

-- expenses.document_id → documents.id (added after documents exists)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_document_id_fkey') then
    alter table public.expenses
      add constraint expenses_document_id_fkey
      foreign key (document_id) references public.documents(id) on delete set null;
  end if;
end$$;

-- ── 3. meta_ads_reports (сутрешният анализ от Hermes) ──────────────────────
create table if not exists public.meta_ads_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  campaign text,
  spend numeric(12, 2),
  leads int,
  cpl numeric(12, 2),
  impressions bigint,
  clicks bigint,
  ctr numeric(6, 3),
  currency text not null default 'EUR',
  quality_notes text,
  recommendations text,
  raw jsonb,
  source text not null default 'hermes'
    check (source in ('hermes', 'email', 'manual')),
  source_email_id text,
  dedupe_key text,
  created_at timestamptz not null default now()
);
-- One row per (date, campaign) — re-ingesting the same morning report updates it.
create unique index if not exists meta_ads_reports_date_campaign_key
  on public.meta_ads_reports (report_date, coalesce(campaign, '(all)'));
create unique index if not exists meta_ads_reports_dedupe_key_key
  on public.meta_ads_reports (dedupe_key) where dedupe_key is not null;
create index if not exists meta_ads_reports_date_idx on public.meta_ads_reports (report_date desc);

-- ── 4. automation_events (одит на автоматизациите) ────────────────────────
create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  status text not null default 'success' check (status in ('success', 'failed', 'skipped')),
  related_contact_id uuid references public.contacts(id) on delete set null,
  related_invoice_id uuid references public.invoices(id) on delete set null,
  related_payment_id uuid references public.payments(id) on delete set null,
  related_document_id uuid references public.documents(id) on delete set null,
  summary text,
  detail jsonb,
  idempotency_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists automation_events_idempotency_key
  on public.automation_events (idempotency_key) where idempotency_key is not null;
create index if not exists automation_events_type_idx on public.automation_events (event_type, created_at desc);
create index if not exists automation_events_created_idx on public.automation_events (created_at desc);

-- ── 5. updated_at triggers ────────────────────────────────────────────────
drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ── 6. RLS ────────────────────────────────────────────────────────────────
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.meta_ads_reports enable row level security;
alter table public.automation_events enable row level security;

drop policy if exists "admins manage expenses" on public.expenses;
create policy "admins manage expenses" on public.expenses for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

drop policy if exists "admins manage documents" on public.documents;
create policy "admins manage documents" on public.documents for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

drop policy if exists "admins manage meta_ads_reports" on public.meta_ads_reports;
create policy "admins manage meta_ads_reports" on public.meta_ads_reports for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

drop policy if exists "admins manage automation_events" on public.automation_events;
create policy "admins manage automation_events" on public.automation_events for all to authenticated
  using (public.is_admin_email((auth.jwt() ->> 'email')::text))
  with check (public.is_admin_email((auth.jwt() ->> 'email')::text));

-- ── 7. realtime ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'documents') then
    alter publication supabase_realtime add table public.documents;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'meta_ads_reports') then
    alter publication supabase_realtime add table public.meta_ads_reports;
  end if;
end$$;

-- ── 8. storage bucket за документи (същия Supabase) ───────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crm-documents', 'crm-documents', false, 52428800, null)
on conflict (id) do nothing;
