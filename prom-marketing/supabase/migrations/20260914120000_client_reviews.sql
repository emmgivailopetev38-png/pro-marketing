-- Страница за одобрение на видеа от клиент: /pregled/<ключ>
--
-- Клиентът отваря таен линк, гледа клиповете, натиска „Одобрявам“ или
-- „Не този“, пише бележка под всеки и накрая „Изпрати избора“. Отговорите
-- се пазят тук след всяко натискане (може да спре и да продължи от друг
-- телефон). При „Изпрати“ сървърът праща имейл на собственика, Telegram и
-- записва активност client_review в CRM-а на контакта.
--
-- Ключът в URL-а е единственият достъп: без вход, без парола. Затова е
-- дълъг и случаен (shokolad-<16 hex>), а страницата е noindex.
-- Само service role чете и пише (страницата и API-то минават през
-- createServiceClient), както при sales_call_reviews.

create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  contact_id uuid references public.contacts(id) on delete set null,
  client_name text,
  title text not null,
  intro text,
  -- [{code, name, line, sound, about, video, poster, tags}]
  items jsonb not null default '[]'::jsonb,
  view_count integer not null default 0,
  last_seen_at timestamptz,
  submit_count integer not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_review_answers (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.client_reviews(id) on delete cascade,
  item_code text not null,
  verdict text check (verdict in ('approved', 'rejected')),
  comment text,
  updated_at timestamptz not null default now(),
  unique (review_id, item_code)
);

create index if not exists client_reviews_contact_idx
  on public.client_reviews (contact_id);
create index if not exists client_review_answers_review_idx
  on public.client_review_answers (review_id);

alter table public.client_reviews enable row level security;
alter table public.client_review_answers enable row level security;

revoke all on public.client_reviews from anon, authenticated;
revoke all on public.client_review_answers from anon, authenticated;
