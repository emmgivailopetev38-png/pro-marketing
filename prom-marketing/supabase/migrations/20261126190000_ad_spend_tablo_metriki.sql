-- Таблото /admin/tablo (по CRM-а на Стефчо, 26.11.2026): синхронът с Meta вече праща и
-- обхвата, кликовете към страницата, посещенията на страницата и регистрациите по Meta.
-- null = редът е от преди тази промяна (тогава не се теглеха).
alter table public.ad_spend_daily
  add column if not exists reach integer,
  add column if not exists link_clicks integer,
  add column if not exists landing_views integer,
  add column if not exists registrations integer;

alter table public.ad_spend_ads_daily
  add column if not exists reach integer,
  add column if not exists link_clicks integer,
  add column if not exists landing_views integer,
  add column if not exists registrations integer;
