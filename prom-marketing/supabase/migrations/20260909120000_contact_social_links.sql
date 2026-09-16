-- Социалните мрежи на клиента живеят в картона му, а не в нечия памет.
-- Един jsonb вместо седем колони: мрежите се сменят по-често от схемата.
-- Форма: { "instagram": "https://www.instagram.com/spi.milo.dete/", … }
-- Ключовете са затворен списък в lib/contacts/social.ts; нормализацията (хендъл
-- → пълен адрес) става там, за да влиза в базата само готов за клик URL.
alter table public.contacts
  add column if not exists social_links jsonb not null default '{}'::jsonb;

comment on column public.contacts.social_links is
  'Профили на клиента по мрежи: website, facebook, instagram, tiktok, youtube, linkedin, threads. Стойностите са пълни https адреси.';
