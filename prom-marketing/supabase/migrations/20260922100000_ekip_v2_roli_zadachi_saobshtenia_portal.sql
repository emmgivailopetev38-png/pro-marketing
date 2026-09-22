-- Екип v2 (22.09.2026).
--
-- Ивайло: „всеки да си има профил“, „втори вход за продавач“, „комуникацията
-- ми с Иван и с клиентите да минава през CRM-а“, „клиентите да следят
-- прогреса и да пишат“, „лични и фирмени разходи отделно“, „конверсии“.
--
-- Тук е само схемата. Правилата са в lib/team/*.ts (чисти, тествани).
-- Само service role чете и пише (страниците минават през createServiceClient),
-- както при team_members и client_reviews.

-- ── 1. Роли и профили ────────────────────────────────────────────────────────
-- sales = продавач (closer), marketing = човекът по рекламите. Какво вижда
-- всеки е по подразбиране от ролята, а `permissions.modules` го променя по човек.
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('owner', 'setter', 'sales', 'delivery', 'marketing'));
alter table public.team_members add column if not exists permissions jsonb not null default '{}'::jsonb;
alter table public.team_members add column if not exists title text;
comment on column public.team_members.permissions is 'Права по модули: {"modules": {"ceni": true, "zvanene": false}} — липсващ ключ = по ролята.';

-- ── 2. Отговорник по картон ──────────────────────────────────────────────────
-- Продавачът, който води човека. NULL = при Ивайло, както беше досега.
alter table public.contacts add column if not exists owner_id uuid references public.team_members(id) on delete set null;
create index if not exists contacts_owner_id_idx on public.contacts(owner_id) where owner_id is not null;

-- ── 3. Порталът на клиента (/klient/<token>) ─────────────────────────────────
alter table public.contacts add column if not exists portal_token text unique;
alter table public.contacts add column if not exists portal_enabled boolean not null default false;
alter table public.contacts add column if not exists portal_last_seen_at timestamptz;
alter table public.contacts add column if not exists portal_views integer not null default 0;

-- ── 4. Задачи за всеки ───────────────────────────────────────────────────────
-- Досега задачата живееше само в проект. Сега може да е обща (за човек от
-- екипа) или по картон (за клиент без проект). Клиентът може да я вижда и да
-- я отметне от портала си.
alter table public.project_tasks alter column project_id drop not null;
alter table public.project_tasks add column if not exists contact_id uuid references public.contacts(id) on delete cascade;
alter table public.project_tasks add column if not exists description text;
alter table public.project_tasks add column if not exists priority text not null default 'normal'
  check (priority in ('low', 'normal', 'high', 'urgent'));
alter table public.project_tasks add column if not exists kind text not null default 'task'
  check (kind in ('task', 'client_request'));
alter table public.project_tasks add column if not exists client_visible boolean not null default false;
alter table public.project_tasks add column if not exists client_done_at timestamptz;
alter table public.project_tasks add column if not exists created_by text;
create index if not exists project_tasks_assignee_open_idx on public.project_tasks(assignee_id) where status <> 'done';
create index if not exists project_tasks_contact_idx on public.project_tasks(contact_id) where contact_id is not null;

-- ── 5. Проект: вид услуга ────────────────────────────────────────────────────
-- По вида се пълнят чеклистите (lib/team/service-types.ts) и се смятат
-- комисионните. `portal_summary` е изречението, което клиентът вижда в портала.
alter table public.projects add column if not exists service_type text;
alter table public.projects add column if not exists portal_summary text;

-- ── 6. Съобщения през CRM-а ──────────────────────────────────────────────────
-- Нишка = thread_key: general · direct:<a>|<b> · contact:<id> · project:<id> ·
-- task:<id>. Участник = 'owner' или id на човек от екипа. Клиентът пише от
-- портала си (from_client), а ние решаваме кое той да вижда (client_visible).
create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  thread_kind text not null check (thread_kind in ('general', 'direct', 'contact', 'project', 'task')),
  thread_ref uuid,
  author_key text not null,
  author_name text not null,
  body text not null,
  mentions text[] not null default '{}',
  client_visible boolean not null default false,
  from_client boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists team_messages_thread_idx on public.team_messages(thread_key, created_at desc);
create index if not exists team_messages_created_idx on public.team_messages(created_at desc);
alter table public.team_messages enable row level security;
revoke all on public.team_messages from anon, authenticated;

create table if not exists public.team_thread_reads (
  participant_key text not null,
  thread_key text not null,
  last_read_at timestamptz not null default now(),
  primary key (participant_key, thread_key)
);
alter table public.team_thread_reads enable row level security;
revoke all on public.team_thread_reads from anon, authenticated;

-- ── 7. Комисионни ────────────────────────────────────────────────────────────
-- Уговорката от 22.09.2026: 200 € на затворен проект, 150 € на уебсайт,
-- 10 % от месечната такса при маркетинг/абонамент. Правилата са редове, за да
-- се сменят без код; начисленията са отделни редове с „дължимо / платено“.
create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  label text not null,
  kind text not null check (kind in ('fixed', 'percent')),
  value numeric not null,
  basis text not null check (basis in ('deal', 'monthly_fee')),
  role text check (role is null or role in ('setter', 'sales', 'delivery', 'marketing')),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.commission_rules enable row level security;
revoke all on public.commission_rules from anon, authenticated;

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  rule_id uuid references public.commission_rules(id) on delete set null,
  service_type text not null,
  label text not null,
  base_amount numeric,
  amount numeric not null,
  currency text not null default 'EUR',
  period text,
  status text not null default 'due' check (status in ('due', 'approved', 'paid', 'cancelled')),
  note text,
  dedupe_key text unique,
  created_by text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists commissions_member_idx on public.commissions(member_id, created_at desc);
alter table public.commissions enable row level security;
revoke all on public.commissions from anon, authenticated;

insert into public.commission_rules (service_type, label, kind, value, basis, role, notes)
select v.service_type, v.label, v.kind, v.value, v.basis, null, v.notes
from (values
  ('marketing',   'Маркетинг · 10 % от месечната такса',        'percent', 10,  'monthly_fee', 'Всеки месец, докато клиентът плаща.'),
  ('crm_support', 'Поддръжка · 10 % от месечната такса',        'percent', 10,  'monthly_fee', 'Всеки месец, докато клиентът плаща.'),
  ('website',     'Уебсайт · 150 € на проект',                   'fixed',   150, 'deal',        null),
  ('crm_build',   'CRM изграждане · 200 € на проект',            'fixed',   200, 'deal',        null),
  ('automation',  'AI автоматизация · 200 € на проект',          'fixed',   200, 'deal',        null),
  ('voice_agent', 'Гласов агент · 200 € на проект',              'fixed',   200, 'deal',        null),
  ('training',    'Обучение / менторство · 200 € на проект',     'fixed',   200, 'deal',        null),
  ('other',       'Друг проект · 200 € на проект',               'fixed',   200, 'deal',        null)
) as v(service_type, label, kind, value, basis, notes)
where not exists (select 1 from public.commission_rules);

-- ── 8. Лични финанси на физическото лице ─────────────────────────────────────
-- Фирмените разходи са в `expenses` (с is_personal за лична покупка през
-- фирмата). Тук са парите на самия Ивайло: приходи (заплата, дивидент, друго)
-- и разходи по категории — за да се вижда фирма и човек поотделно.
create table if not exists public.personal_finance (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income', 'expense')),
  category text not null default 'other',
  description text,
  amount numeric not null,
  currency text not null default 'EUR',
  occurred_on date not null,
  recurring boolean not null default false,
  note text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists personal_finance_date_idx on public.personal_finance(occurred_on desc);
alter table public.personal_finance enable row level security;
revoke all on public.personal_finance from anon, authenticated;
