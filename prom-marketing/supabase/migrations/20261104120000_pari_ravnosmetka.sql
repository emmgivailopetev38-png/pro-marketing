-- Пари · равносметка (04.11.2026).
--
-- Ивайло: „кредити, разходи, приходи, изтеглени — пълна оптимизация на
-- разходите и приходите да се следи и знае“.
--
-- Две таблици. Правилата (сборове, сигнали) са в lib/crm/pari.ts (чисти,
-- тествани). Само service role чете и пише, както при personal_finance.

-- ── 1. Кредити и задължения / вземания ───────────────────────────────────────
-- direction: payable = ние дължим (кредит, карта, лизинг, доставчик);
--            receivable = на нас ни дължат (договор, остатък по сделка).
-- owner: company = фирмата, personal = Ивайло като човек.
-- status: active · potential (още не е договорено — не влиза в сборовете) · closed.
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  direction text not null default 'payable' check (direction in ('payable', 'receivable')),
  owner text not null default 'company' check (owner in ('company', 'personal')),
  kind text not null default 'loan'
    check (kind in ('loan', 'revolving', 'credit_card', 'leasing', 'supplier', 'contract', 'other')),
  status text not null default 'active' check (status in ('active', 'potential', 'closed')),
  name text not null,
  counterparty text,
  account text,
  contact_id uuid references public.contacts(id) on delete set null,
  original_amount numeric,
  balance numeric,
  balance_as_of date,
  credit_limit numeric,
  installment numeric,
  due_day integer check (due_day is null or due_day between 1 and 31),
  next_due_date date,
  interest_rate numeric,
  ends_on date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists debts_status_idx on public.debts(status, direction);
alter table public.debts enable row level security;
revoke all on public.debts from anon, authenticated;

-- ── 2. Движенията по сметките ────────────────────────────────────────────────
-- Истината за парите е банката, не фактурите. account_type:
--   bank = разплащателна (сборовете „влезли/излезли“ се смятат САМО от тях);
--   card = ред от извлечение на кредитна карта (подробност: за какво е
--          похарчено и колко е теглено в брой от картата). Погасяването на
--          картата вече е „излязло“ от банката, затова card не влиза в сбора.
-- category: client · stripe · loan_draw · own_transfer · cash_deposit · refund ·
--   cash_withdrawal · card_repayment · loan_payment · ads · software ·
--   education · accountant · taxes · supplier · telecom · insurance ·
--   bank_fees · owner_transfer · personal · other
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  owner text not null default 'company' check (owner in ('company', 'personal')),
  account text not null,
  account_type text not null default 'bank' check (account_type in ('bank', 'card')),
  direction text not null check (direction in ('in', 'out')),
  amount numeric not null check (amount >= 0),
  currency text not null default 'EUR',
  category text not null default 'other',
  counterparty text,
  description text,
  debt_id uuid references public.debts(id) on delete set null,
  source text not null default 'manual',
  dedupe_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists cash_movements_date_idx on public.cash_movements(occurred_on desc);
alter table public.cash_movements enable row level security;
revoke all on public.cash_movements from anon, authenticated;
