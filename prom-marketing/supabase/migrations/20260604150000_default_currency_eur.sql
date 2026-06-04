-- Default currency → EUR everywhere (owner preference: smята в евро).
-- Existing rows keep their stored currency; only new rows default to EUR.
alter table public.invoices alter column currency set default 'EUR';
alter table public.payments alter column currency set default 'EUR';
alter table public.recurring_services alter column currency set default 'EUR';
