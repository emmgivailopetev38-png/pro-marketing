-- Страницата за одобрение: общи насоки от клиента към нас (не към отделен клип).
-- Записва се при пауза в писането (както бележките по клип) и влиза в имейла,
-- Telegram-а и CRM активността при „Изпрати избора“.
alter table public.client_reviews
  add column if not exists general_comment text;
