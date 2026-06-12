-- ─────────────────────────────────────────────────────────────────────────
-- Правилни данни: фактурата знае от коя оферта/проект идва.
-- Затваря паричния кръг оферта → проект → фактура (Одиторът проверява
-- „done проект без фактура" по тези връзки).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.invoices
  add column if not exists offer_id uuid references public.offers(id) on delete set null;

alter table public.invoices
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists invoices_offer_idx on public.invoices (offer_id) where offer_id is not null;
create index if not exists invoices_project_idx on public.invoices (project_id) where project_id is not null;
