-- „🗓 Моят график“ (25.11.2026): кога клоузърът може да води срещи.
-- {"week": {"1": [18,19,20], ...}, "days": {"2026-11-27": []}} — часове 10..21 (клетка = един час).
-- null = без график (както досега: всеки свободен час от 10:00).
alter table public.team_members add column if not exists availability jsonb;
comment on column public.team_members.availability is 'Графикът на клоузъра: week (ISO ден → часове) + days (конкретен ден → часове). null = без график.';
