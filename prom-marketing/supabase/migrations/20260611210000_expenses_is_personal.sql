-- ─────────────────────────────────────────────────────────────────────────
-- expenses.is_personal — лични тегления на собственика през фирмата.
--
-- Когато Ивайло купи нещо лично през фирмената сметка/карта, това НЕ е бизнес
-- разход: не намалява печалбата/маржа и НЕ дава приспадаемо ДДС. Маркираме го
-- с is_personal=true, за да се води ОТДЕЛНО от реалните бизнес разходи.
-- paid_by пази с какъв инструмент е платено (банка/карта/кеш) — само за справка.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.expenses
  add column if not exists is_personal boolean not null default false;

alter table public.expenses
  add column if not exists paid_by text;

-- Частичен индекс — обикновено филтрираме само личните (малко на брой) редове.
create index if not exists expenses_is_personal_idx
  on public.expenses (is_personal) where is_personal = true;
