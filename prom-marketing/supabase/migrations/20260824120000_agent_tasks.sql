-- ─────────────────────────────────────────────────────────────────────────
-- agent_tasks — опашката между ГЛАСА и ХЕРМЕС.
--
-- Гласовият агент отговаря за секунди: чете CRM-а и поправя картони направо.
-- Но „виж какво стана с рекламите на Алине вчера и ми напиши анализ" не е
-- работа за жив разговор — Хермес мисли по минута и повече, а дотогава
-- телефонната линия мълчи и разговорът умира.
--
-- Затова тежките задачи не се ИЗПЪЛНЯВАТ по телефона, а се ЗАПИСВАТ тук.
-- Гласът казва „предадох го" и затваря; Хермес ги взима от VPS-а и отговаря
-- в Telegram. Опашка, а не HTTP повикване, нарочно: Vercel не бива да чака
-- сървър, който може да се рестартира по средата (`hermes update` го прави).
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'voice' check (source in ('voice', 'admin', 'automation')),
  task text not null,                       -- какво да свърши, с думите на Ивайло
  context jsonb,                            -- контакт, номер на обаждащия се, каквото има
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  result text,                              -- какво е върнал Хермес
  error text,
  requested_by text,                        -- „voice:+359…" — кой е поискал
  claimed_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Работникът на VPS-а пита за нова задача всяка минута — частичен индекс,
-- за да е евтино дори когато опашката е празна (което е през повечето време).
create index if not exists agent_tasks_queued_idx
  on public.agent_tasks (created_at)
  where status = 'queued';

create index if not exists agent_tasks_recent_idx on public.agent_tasks (created_at desc);

drop trigger if exists agent_tasks_set_updated_at on public.agent_tasks;
create trigger agent_tasks_set_updated_at before update on public.agent_tasks
  for each row execute function public.set_updated_at();

-- Без политики: до таблицата се стига само със service ключа през /api/crm/*.
alter table public.agent_tasks enable row level security;
