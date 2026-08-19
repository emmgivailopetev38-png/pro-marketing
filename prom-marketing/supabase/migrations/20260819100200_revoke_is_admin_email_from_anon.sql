-- Supabase advisor 0028: is_admin_email() е SECURITY DEFINER и стоеше
-- извикваема от анонимната роля през /rest/v1/rpc/is_admin_email — тоест
-- всеки в интернет можеше да пита „този имейл админ ли е?" и така да изброи
-- собствениците на CRM-а.
--
-- anon НЯМА нито една RLS политика по тези таблици, значи функцията не му
-- трябва. authenticated я запазва: RLS изразите се оценяват с правата на
-- извикващия, така че отнемането ѝ там би счупило целия админ достъп.
revoke execute on function public.is_admin_email(text) from anon;
revoke execute on function public.is_admin_email(text) from public;
grant execute on function public.is_admin_email(text) to authenticated;
grant execute on function public.is_admin_email(text) to service_role;
