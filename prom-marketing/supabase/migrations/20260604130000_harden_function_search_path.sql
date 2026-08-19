-- Hardening: pin search_path on pre-existing trigger functions so they cannot
-- be hijacked via a mutable role search_path (Supabase advisor 0011).
-- Behaviour-identical — only adds the SET search_path GUC.
--
-- FIX 2026-08-19: this migration also altered public.touch_updated_at(), a
-- function that NO migration ever creates — it only ever existed as hand-made
-- drift in the original project. On a clean database that bare ALTER aborts
-- the whole migration ("function does not exist"), which made the migration
-- chain unreplayable. The ALTERs are now guarded.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'touch_contacts_updated_at') then
    alter function public.touch_contacts_updated_at() set search_path = public;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'bump_contact_on_activity') then
    alter function public.bump_contact_on_activity() set search_path = public;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'touch_updated_at') then
    alter function public.touch_updated_at() set search_path = public;
  end if;
end$$;
