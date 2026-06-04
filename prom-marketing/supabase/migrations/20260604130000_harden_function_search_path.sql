-- Hardening: pin search_path on pre-existing trigger functions so they cannot
-- be hijacked via a mutable role search_path (Supabase advisor 0011).
-- Behaviour-identical — only adds the SET search_path GUC.

alter function public.touch_contacts_updated_at() set search_path = public;
alter function public.bump_contact_on_activity() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
