-- ─────────────────────────────────────────────────────────────────────────
-- Миграция към новия Supabase проект (19.08.2026).
--
-- 1. bookings.meeting_url — кодът пише и чете тази колона на 6 места
--    (app/api/webhooks/cal/route.ts, админ таблото, BookingsTable), но
--    миграция за нея никога не е имало: добавена е на ръка в стария проект.
--    Без нея всеки Cal.com webhook пада при запис на среща.
-- 2. admin_emails — старият Gmail е окончателно спрян от Google; сменяме го
--    с новия, иначе is_admin_email() отказва достъп до целия CRM през RLS.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.bookings
  add column if not exists meeting_url text;

insert into public.admin_emails (email) values ('emmgivailopetev38@gmail.com')
  on conflict do nothing;

delete from public.admin_emails where lower(email) = 'ivailopetev38@gmail.com';
