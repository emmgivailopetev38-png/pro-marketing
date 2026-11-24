-- Рекламният разход по ден × РЕКЛАМА (не само по кампания) — за таблото
-- „Бизнесът“ в /ekip (24.11.2026, мениджърите на RevStream: „кои реклами,
-- колко ни е струвал лийдът, до последната стотинка“).
--
-- ad_spend_daily остава източникът за цената по кампания; тази таблица дава
-- разбивката по реклама вътре в кампанията. Пълни се от същия синхрон на
-- VPS-а (/root/ads-spend-sync.py → POST /api/crm/ads-spend с level = "ad").
-- Идемпотентно по (платформа, акаунт, реклама, ден) — Meta дозакръгля два дни назад.
-- Само service role чете и пише.

create table if not exists public.ad_spend_ads_daily (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  platform text not null default 'meta',
  account_id text not null,
  campaign_id text not null,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text not null,
  ad_name text,
  purpose text not null default 'other'
    check (purpose in ('leads', 'client', 'shop', 'hiring', 'other')),
  spend numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  spend_eur numeric(12, 2) not null default 0,
  fx_rate numeric(12, 6),
  fx_source text,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, account_id, ad_id, day)
);

create index if not exists ad_spend_ads_daily_ad_idx on public.ad_spend_ads_daily (ad_id);
create index if not exists ad_spend_ads_daily_day_idx on public.ad_spend_ads_daily (day);

alter table public.ad_spend_ads_daily enable row level security;
-- Без политики: anon и authenticated не виждат нищо; service role минава.
