-- FX preservation: keep amounts in EUR but remember the original currency + rate.
-- Bulgarian lev is irrevocably pegged to the euro at 1 EUR = 1.95583 BGN.
alter table public.invoices
  add column if not exists original_amount numeric,
  add column if not exists original_currency text,
  add column if not exists fx_rate numeric,
  add column if not exists fx_source text;

alter table public.payments
  add column if not exists original_amount numeric,
  add column if not exists original_currency text,
  add column if not exists fx_rate numeric,
  add column if not exists fx_source text;

alter table public.expenses
  add column if not exists original_amount numeric,
  add column if not exists original_currency text,
  add column if not exists fx_rate numeric,
  add column if not exists fx_source text;

-- Manual review: richer lifecycle.
--   needs_user = waiting on Ивайло's decision/input
--   blocked    = stuck on an external dependency
alter table public.manual_review_items drop constraint if exists manual_review_items_status_check;
alter table public.manual_review_items add constraint manual_review_items_status_check
  check (status = any (array['open'::text, 'resolved'::text, 'ignored'::text, 'needs_user'::text, 'blocked'::text]));
