-- Гласовият агент — опашка за одобрения и собствен scope за правила.
--
-- Гласът може да чете всичко и да пише в CRM-а, но необратимите неща
-- (имейл до клиент, харчене по реклами, триене) НЕ се изпълняват по телефона.
-- Те влизат тук като заявка и чакат Ивайло да ги одобри от /admin.
-- Причина: гласовата сесия се доверява на говорещия, а необратимото действие
-- не бива да зависи само от това кой е успял да заговори агента.

-- 1. Какво точно да се изпълни при одобрение. Съществуващите редове (от
--    счетоводните проверки) нямат payload и остават с NULL — затова е nullable.
alter table public.manual_review_items
  add column if not exists payload jsonb;

comment on column public.manual_review_items.payload is
  'За type=voice_approval: действието, което чака одобрение (tool + аргументи).';

-- 2. Нов тип заявка. Старите осем са само счетоводни — гласът няма къде да пише.
alter table public.manual_review_items
  drop constraint if exists manual_review_items_type_check;

alter table public.manual_review_items
  add constraint manual_review_items_type_check check (
    type = any (array[
      'invoice_match',
      'payment_match',
      'missing_contact',
      'ambiguous_pdf',
      'email_parse_error',
      'bank_statement_error',
      'duplicate_invoice',
      'recurring_billing_issue',
      'voice_approval'
    ])
  );

-- 3. Собствен scope, за да може гласът да има правила, различни от
--    тези на пощальона/счетоводителя (напр. „не чети суми на глас пред клиент").
alter table public.agent_rules
  drop constraint if exists agent_rules_scope_check;

alter table public.agent_rules
  add constraint agent_rules_scope_check check (
    scope = any (array['postalion', 'accountant', 'sales', 'ads', 'auditor', 'all', 'voice'])
  );

-- 4. Опашката се чете при всяко отваряне на /admin — индекс по отворените.
create index if not exists manual_review_items_open_voice_idx
  on public.manual_review_items (created_at desc)
  where status = 'open' and type = 'voice_approval';
