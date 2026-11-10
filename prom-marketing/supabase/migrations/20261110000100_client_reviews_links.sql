-- Страницата за одобрение (/pregled/<ключ>): бутони към документи до клиповете (анализ, план, скриптове).
-- [{ "label": "📄 Анализът и планът", "href": "/analiz/….pdf", "note": "4 стр. · отваря се направо" }]
alter table public.client_reviews
  add column if not exists links jsonb not null default '[]'::jsonb;

comment on column public.client_reviews.links is
  'Бутони към документи под увода на /pregled: [{label, href (/… или https://…), note?}]';
