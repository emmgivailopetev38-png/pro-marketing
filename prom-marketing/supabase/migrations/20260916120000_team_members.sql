-- Екип: хора, които влизат в CRM-а с личен вход.
--
-- Дотук /admin имаше ЕДНА обща парола и всичко човешко се записваше като
-- „Ивайло“. От 16.09.2026 има човек за срещите (appointment setter), който
-- звъни на новите лийдове от рекламите и ги обработва от телефона си.
-- Той влиза през /ekip с имейл + своя парола, бисквитката носи неговото id,
-- а всяка активност, която записва, е с created_by = неговото име и
-- metadata.team_member_id = неговото id.
--
-- Паролата се пази като scrypt хеш (lib/team/password.ts), никога в чист вид.
-- Ролята решава какво вижда: setter → само опашката за звънене.
-- Само service role чете и пише (страниците минават през createServiceClient),
-- както при client_reviews и sales_call_reviews.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'setter'
    check (role in ('owner', 'setter', 'delivery')),
  password_hash text,
  active boolean not null default true,
  -- нов лийд от реклама или сайта → и на неговия имейл
  notify_new_leads boolean not null default true,
  -- уговорката с човека: комисиона, срок, кога започва
  notes text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;

-- „С какво се занимава“ — човекът за срещите го записва след първия разговор.
-- Отделно от company (името на фирмата), защото при лийд от реклама фирма
-- често няма, а дейност винаги има.
alter table public.contacts add column if not exists business text;

-- Кой е записал активността — по това се брои работата на всеки от екипа.
create index if not exists contact_activities_created_by_idx
  on public.contact_activities (created_by);
