-- Тефтерът на гласовия агент: кой колко минути е изговорил.
--
-- Дотук таванът беше само общ — дванайсет разговора на ден за ЦЯЛОТО демо
-- (`checkVoiceBudget`). Един човек с много любопитство изяждаше деня на
-- всички останали, а 275-те минути в плана — месеца. Този тефтер брои по
-- човек: имейл, телефон и (за онези, които сменят и двете) отпечатък на IP.
--
-- Редът се отваря, когато линията се отваря, и се затваря от post-call
-- webhook-а на ElevenLabs, който знае истинската продължителност. Между
-- двете стои `seconds = 0`, затова има и таван на ОТВОРЕНИТЕ сесии — иначе
-- десет натискания за минута минават, преди първата да се е отчела.

create table if not exists public.voice_sessions (
  id uuid primary key default gen_random_uuid(),

  -- Ключът, който браузърът връща обратно на `zapishi_chas`. Заради него
  -- часът се записва на човека от формата, а не на този, когото агентът е
  -- бил убеден да напише.
  session_key text not null unique,

  contact_id uuid references public.contacts(id) on delete set null,

  -- Нормализирани: имейлът в малки букви, телефонът само с цифри (+359 и
  -- 0 отпред са един и същ номер). Отпечатъкът на IP е sha256, не адрес —
  -- за броене стига, а суров IP не ни трябва за нищо.
  email text,
  phone_key text,
  ip_hash text,

  channel text not null default 'sait',

  -- Идва от webhook-а. Уникален, за да не се отчете един разговор два пъти.
  conversation_id text unique,
  seconds integer not null default 0,
  booked boolean not null default false,

  opened_at timestamptz not null default now(),
  ended_at timestamptz,

  -- Защо е спряна линията, ако е спряна: 'limit' | 'admin' | null.
  blocked_reason text
);

comment on table public.voice_sessions is
  'Един ред на отворена линия с гласовия агент. seconds се попълва от post-call webhook-а на ElevenLabs.';

-- Търсенето е винаги „този човек, последните трийсет дни" — затова индексите
-- са съставни и почват от идентичността.
create index if not exists voice_sessions_email_idx on public.voice_sessions (email, opened_at desc) where email is not null;
create index if not exists voice_sessions_phone_idx on public.voice_sessions (phone_key, opened_at desc) where phone_key is not null;
create index if not exists voice_sessions_ip_idx on public.voice_sessions (ip_hash, opened_at desc) where ip_hash is not null;
create index if not exists voice_sessions_opened_idx on public.voice_sessions (opened_at desc);

alter table public.voice_sessions enable row level security;

-- Никой освен service role. Табличката съдържа телефони и имейли на хора,
-- които още не са клиенти; `anon` няма работа тук дори за четене.
drop policy if exists "service role manages voice sessions" on public.voice_sessions;
create policy "service role manages voice sessions"
  on public.voice_sessions
  for all
  to service_role
  using (true)
  with check (true);
