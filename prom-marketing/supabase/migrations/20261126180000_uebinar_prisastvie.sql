-- Уебинарът: кой е дошъл, докога е стоял и в коя опашка за звънене е (26.11.2026).
--
-- Ивайло: „тези редици и колони за хората… да ги подреди в системите на всички…
-- и статистиката… кой кога е стоял… опашките да стоят, после автоматично ще ги
-- попълним след вебинара“. Редът на звънене е по системата на Йоан Йончев:
--   zapisal   — записал си е час сам (на уебинара или след него) → клоузърът;
--   oferta    — стоял до офертата, без час → първи за звънене;
--   rano      — дошъл, но излязъл преди офертата;
--   ne_doshal — записан, но не влязъл.
--
-- Данните идват сами от Notifier (GET /webinars/{id}/statistics, проследяване
-- по човек), на всеки 5 минути от крона /api/cron/uebinar. Пише само сървърът.

create table if not exists public.uebinar_prisastvie (
  id uuid primary key default gen_random_uuid(),
  -- изданието: датата на уебинара, напр. '2026-11-29'
  uebinar text not null,
  contact_id uuid references public.contacts(id) on delete cascade,
  ime text,
  email text,
  telefon text,
  -- от Notifier
  notifier_id text,
  vlyazal_at timestamptz,
  minuti integer not null default 0,
  chul_ofertata boolean not null default false,
  notifier_segment text,
  toplina integer,
  toplina_nivo text,
  kliknal_at timestamptz,
  -- нашата опашка (смята се при всяко обновяване)
  segment text not null check (segment in ('zapisal', 'oferta', 'rano', 'ne_doshal')),
  zapisal_chas_at timestamptz,
  obnoveno_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (uebinar, contact_id)
);

create index if not exists uebinar_prisastvie_uebinar_segment_idx on public.uebinar_prisastvie (uebinar, segment);

alter table public.uebinar_prisastvie enable row level security;

-- Една редица на издание: числата на вечерта (графиката по минути, пикът, офертата).
create table if not exists public.uebinar_statistika (
  uebinar text primary key,
  notifier_webinar text,
  nachalo_at timestamptz,
  kraj_at timestamptz,
  oferta_at timestamptz,
  -- 'notifier' = зададен от нас/в Notifier; 'priblizitelno' = сложен сам, защото никой не го е задал
  oferta_izvor text,
  zapisani integer not null default 0,
  doshli integer not null default 0,
  chuli_ofertata integer,
  do_kraya integer not null default 0,
  pik integer not null default 0,
  pik_at timestamptz,
  sredno_minuti integer not null default 0,
  kriva_start_at timestamptz,
  kriva integer[] not null default '{}',
  nai_golyam_spad jsonb,
  rates jsonb,
  obnoveno_at timestamptz not null default now()
);

alter table public.uebinar_statistika enable row level security;
