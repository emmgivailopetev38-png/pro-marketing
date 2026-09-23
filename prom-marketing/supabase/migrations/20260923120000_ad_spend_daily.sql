-- Рекламният разход по ден и кампания — за да се смята сама цената на лийд,
-- на среща и на придобит клиент.
--
-- Дотук страницата „Конверсии“ четеше разхода от `expenses` с категория „ads“.
-- Там влизат фактурите на Meta, които идват веднъж месечно и със закъснение,
-- затова цената на резултата стоеше „—“ през целия месец. Освен това в един
-- общ сбор се смесваха НАШИТЕ кампании за лийдове с кампаниите на клиенти
-- (къщата на Белцов), собствения магазин (Green Elexir) и обявата за клоузър.
--
-- Тази таблица държи суровите числа от Meta: един ред на ден × кампания.
-- Пълни се автоматично (скрипт на сървъра → POST /api/crm/ads-spend, всеки ден).
-- `purpose` казва за какво е харчено — само `leads` влиза в цената на резултата.
-- Записите НЕ са счетоводен документ и не влизат в `expenses`: истинските
-- фактури на Meta продължават да идват от счетоводителя, за да няма двойно
-- отчитане.
--
-- Само service role чете и пише (страниците минават през createServiceClient),
-- както при team_members и client_reviews.

create table if not exists public.ad_spend_daily (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  platform text not null default 'meta',
  account_id text not null,
  campaign_id text not null,
  campaign_name text,
  objective text,
  -- leads = наша кампания за лийдове (влиза в цената на резултата)
  -- client = кампания на клиент · shop = наш магазин · hiring = обява за човек
  -- other = неразпозната (показва се отделно, за да не се крие разход)
  purpose text not null default 'other'
    check (purpose in ('leads', 'client', 'shop', 'hiring', 'other')),
  spend numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  spend_eur numeric(12, 2) not null default 0,
  fx_rate numeric(12, 6),
  fx_source text,
  impressions integer not null default 0,
  clicks integer not null default 0,
  -- колко лийда отчита самата Meta (за сверка със CRM-а)
  leads integer not null default 0,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, account_id, campaign_id, day)
);

create index if not exists ad_spend_daily_day_idx on public.ad_spend_daily (day desc);
create index if not exists ad_spend_daily_purpose_day_idx on public.ad_spend_daily (purpose, day desc);

alter table public.ad_spend_daily enable row level security;
revoke all on public.ad_spend_daily from anon, authenticated;

comment on table public.ad_spend_daily is
  'Дневен рекламен разход по кампания от Meta. Пълни се от синхрона (POST /api/crm/ads-spend). Само purpose=leads влиза в цената на лийд/среща/клиент.';
