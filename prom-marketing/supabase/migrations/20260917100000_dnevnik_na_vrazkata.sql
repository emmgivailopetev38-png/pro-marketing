-- Дневникът на връзката (17.09.2026).
--
-- Ивайло: „като чуя някой, да си го чувам“ — след всеки разговор да може да
-- запише как се е чувствал човекът, какво сме говорили, какво е обещал той,
-- какво съм обещал аз, какво е станало, и напомняне малко по-напред, за да го
-- чуе пак. И снимка на всеки човек, за да го познава.
--
-- Записът на разговора живее в contact_activities (metadata.kind = 'dnevnik'),
-- за да е в същата хронология с имейлите и срещите. Тук са само нещата, които
-- трябва да се търсят и отмятат отделно: настроението и снимката на картона и
-- обещанията като редове с „изпълнено“.

alter table public.contacts add column if not exists photo_url text;
alter table public.contacts add column if not exists photo_source text
  check (photo_source is null or photo_source in ('upload', 'url', 'fathom'));
alter table public.contacts add column if not exists photo_updated_at timestamptz;
-- последното записано настроение: zapalen | pozitiven | neutralen | kolebliv | studen
alter table public.contacts add column if not exists mood text;
alter table public.contacts add column if not exists mood_updated_at timestamptz;

create table if not exists public.contact_promises (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  -- кой дължи: той (them) или ние (us)
  who text not null check (who in ('them', 'us')),
  text text not null,
  due_at timestamptz,
  done_at timestamptz,
  -- разговорът, в който е обещано
  activity_id uuid references public.contact_activities (id) on delete set null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists contact_promises_contact_open_idx
  on public.contact_promises (contact_id, done_at);

alter table public.contact_promises enable row level security;
revoke all on public.contact_promises from anon, authenticated;

-- Снимките са лични данни: частен бъкет, раздава се само с подписан линк.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contact-photos', 'contact-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
