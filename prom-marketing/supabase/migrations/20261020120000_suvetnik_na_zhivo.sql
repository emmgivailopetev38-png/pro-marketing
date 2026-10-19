-- Съветникът на живо: всеки разговор — транскрипт, подсказки, разбор. Само през админ сървъра.
create table if not exists public.suvetnik_sesii (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  zapochna timestamptz,
  priklyuchi timestamptz,
  rejim text check (rejim in ('online', 'mikrofon')),
  klient text,
  kontakt_id uuid,
  brif jsonb,
  sastoyanie jsonb,
  transcript jsonb,
  podskazki jsonb,
  obobshtenie jsonb
);

create index if not exists suvetnik_sesii_created_idx on public.suvetnik_sesii (created_at desc);
create index if not exists suvetnik_sesii_kontakt_idx on public.suvetnik_sesii (kontakt_id);

alter table public.suvetnik_sesii enable row level security;
revoke all on public.suvetnik_sesii from anon, authenticated;

create policy "service role manages suvetnik sesii"
  on public.suvetnik_sesii for all to service_role using (true) with check (true);
