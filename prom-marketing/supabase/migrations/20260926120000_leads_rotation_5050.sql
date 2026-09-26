-- Ротацията на новите лийдове между хората на звъненето (26.09.2026).
-- Ивайло: „като влезе нов лийд, един да влиза при Елена и един при Димитър — 50 на 50“.
-- Само добавя колони: старият код ги пропуска, затова миграцията върви преди деплоя.

alter table public.contacts
  add column if not exists routed_to uuid references public.team_members(id) on delete set null,
  add column if not exists routed_at timestamptz;

comment on column public.contacts.routed_to is
  'Човекът от екипа, при когото е влязъл лийдът (ротацията на звъненето). null = стар лийд → при първия в кръга.';
comment on column public.contacts.routed_at is
  'Кога лийдът е даден по ротацията — следващият се избира след последния получил.';

create index if not exists contacts_routed_at_idx
  on public.contacts (routed_at desc)
  where routed_to is not null;
