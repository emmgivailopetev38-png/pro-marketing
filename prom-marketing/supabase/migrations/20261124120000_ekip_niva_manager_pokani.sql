-- Екипът по продажбите на нива (24.11.2026, договорът с RevStream):
--   • роля „manager“ — мениджър продажби, вижда хората, срещите и числата на екипа;
--   • org — чий човек е (наш / на партньора), от него зависи кой мениджър вижда парите му;
--   • intake — получава ли новите лийдове и неразпределените стари (сетърът — да; клоузър — не);
--   • meet_url — постоянният Meet линк на клоузъра (всеки е домакин на своите срещи);
--   • team_invites — покана с линк: човекът сам въвежда името, имейла и ПАРОЛАТА си.

alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members
  add constraint team_members_role_check
  check (role = any (array['owner'::text, 'manager'::text, 'setter'::text, 'sales'::text, 'delivery'::text, 'marketing'::text]));

alter table public.team_members add column if not exists org text not null default 'promarketing';
alter table public.team_members add column if not exists intake boolean not null default true;
alter table public.team_members add column if not exists meet_url text;

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role text not null check (role = any (array['manager'::text, 'setter'::text, 'sales'::text, 'delivery'::text, 'marketing'::text])),
  org text not null default 'promarketing',
  title text,
  full_name text,
  modules jsonb not null default '{}'::jsonb,
  intake boolean not null default true,
  note text,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.team_members(id) on delete set null,
  revoked_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

-- Само сървърът (service role) чете и пише поканите; за anon/authenticated няма политика.
alter table public.team_invites enable row level security;

-- Георги (клоузър) пази опашката и хората си, но новите лийдове отиват при сетъра, щом той влезе.
-- Докато няма сетър, кръгът е само Георги и той получава всичко, както досега (intakePool).
update public.team_members set intake = false where slug = 'dzhordzh-mandadzhiev';
