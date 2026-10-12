-- Лична тренировка по менторството. Достъпът минава само през админ сървъра.
create table if not exists public.trening_sesii (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tema text,
  rejim text check (rejim in ('uchi', 'izpit', 'rolya', 'tekst')),
  conversation_id text,
  prodalzhitelnost_sek integer,
  transcript jsonb,
  analiz jsonb,
  zavarshena boolean not null default false
);

create table if not exists public.trening_otgovori (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sesia_id uuid references public.trening_sesii(id) on delete set null,
  card_id text not null,
  tema text not null,
  rejim text not null,
  kazano text,
  ocenka smallint check (ocenka in (0, 1, 2)),
  komentar text
);

create index if not exists trening_otgovori_card_created_idx
  on public.trening_otgovori (card_id, created_at desc);
create index if not exists trening_otgovori_sesia_idx
  on public.trening_otgovori (sesia_id);
create index if not exists trening_sesii_created_idx
  on public.trening_sesii (created_at desc);

alter table public.trening_sesii enable row level security;
alter table public.trening_otgovori enable row level security;
revoke all on public.trening_sesii from anon, authenticated;
revoke all on public.trening_otgovori from anon, authenticated;

create policy "service role manages trening sesii"
  on public.trening_sesii for all to service_role using (true) with check (true);
create policy "service role manages trening otgovori"
  on public.trening_otgovori for all to service_role using (true) with check (true);
