-- 10.11.2026 · Записите от срещите (Ивайло: „Георги след всеки разговор да добавя линковете от записаните срещи,
-- за да ги анализираме после; бутон, място, напомняне и задача в системата“).
alter table public.bookings add column if not exists recording_url text;
alter table public.bookings add column if not exists recording_added_at timestamptz;
alter table public.bookings add column if not exists recording_added_by text;
-- напомнянията за липсващ запис (колко пъти и кога за последно) — за да не спамим
alter table public.bookings add column if not exists recording_reminders integer not null default 0;
alter table public.bookings add column if not exists recording_reminded_at timestamptz;

comment on column public.bookings.recording_url is 'Линкът към записа на срещата (Fathom, Meet/Drive, Loom…) — за анализ на разговора';
create index if not exists bookings_recording_missing_idx on public.bookings (scheduled_at) where recording_url is null;
