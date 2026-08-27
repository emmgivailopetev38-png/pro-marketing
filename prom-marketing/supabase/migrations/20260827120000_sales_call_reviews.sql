-- Записка за всеки продажбен разговор: подготовка, какво излезе, оценка.
-- Само service role пише и чете (админ панелът минава през createServiceClient).
create table if not exists public.sales_call_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  call_date date not null default current_date,

  contact_id uuid references public.contacts(id) on delete set null,
  client_name text,
  channel text not null default 'onlain',

  -- подготовка преди срещата
  prep jsonb not null default '{}'::jsonb,

  -- какво излезе от разговора
  reached_stage text,
  client_words text,
  client_number text,
  root_cause text,
  client_picture text,

  -- възражения, които се появиха
  objections jsonb not null default '[]'::jsonb,

  -- изход
  outcome text not null default 'sledvashta_stapka',
  deal_value numeric,
  next_step text,
  next_step_at date,

  -- самооценка
  scores jsonb not null default '{}'::jsonb,
  avg_score numeric,
  lesson text,
  notes text
);

create index if not exists sales_call_reviews_date_idx
  on public.sales_call_reviews (call_date desc);
create index if not exists sales_call_reviews_contact_idx
  on public.sales_call_reviews (contact_id);

alter table public.sales_call_reviews enable row level security;

revoke all on public.sales_call_reviews from anon, authenticated;
