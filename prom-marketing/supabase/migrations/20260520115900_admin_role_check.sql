create or replace function public.is_admin_email(email_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    email_input = any(string_to_array(current_setting('app.allowed_admin_emails', true), ',')),
    false
  );
$$;

-- NOTE: Configure via Supabase Dashboard → Settings → Database → Custom Postgres Config:
--   app.allowed_admin_emails = 'owner@promarketing.bg,other@promarketing.bg'
-- Then: select pg_reload_conf();
