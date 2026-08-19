-- ─────────────────────────────────────────────────────────────────────────
-- Липсващите 8 таблици (реконструирани 19.08.2026).
--
-- Кодът чете и пише в тях, но миграция за тях НИКОГА не е имало — правени са
-- на ръка направо в стария проект. Затова на чиста база целият чатбот,
-- Messenger webhook-ът и 4 админ страници гърмят с "relation does not exist".
-- Схемата тук е изведена буквално от колоните, които кодът selects/inserts:
--   chatbot_*             app/api/chatbot/message/route.ts,
--                         app/api/webhooks/messenger/route.ts,
--                         app/admin/(protected)/chatbots/**
--   meta_pages            app/api/webhooks/messenger/route.ts,
--                         app/admin/(protected)/messenger/page.tsx
--   demo_sessions         app/admin/(protected)/demo/page.tsx
--   meta_campaigns_snapshot  app/admin/(protected)/ads/page.tsx
--   whatsapp_*            app/admin/(protected)/whatsapp/page.tsx
-- ─────────────────────────────────────────────────────────────────────────

-- ── meta_pages (Facebook страници за Messenger бота) ──────────────────────
create table if not exists public.meta_pages (
  id uuid primary key default gen_random_uuid(),
  page_id text not null unique,
  page_name text,
  access_token text,
  webhook_verify_token text unique,
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'error', 'disconnected')),
  subscribed_fields text[] not null default '{}',
  error_message text,
  token_expires_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists meta_pages_status_idx on public.meta_pages (status);

-- ── chatbot_conversations ─────────────────────────────────────────────────
create table if not exists public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'site_chatbot'
    check (scope in ('site_chatbot', 'sales_bot', 'support_bot')),
  channel text not null default 'website'
    check (channel in ('website', 'instagram_dm', 'facebook_messenger', 'whatsapp',
                       'telegram', 'viber', 'sms', 'other')),
  session_id text not null,
  meta_page_id uuid references public.meta_pages(id) on delete set null,
  external_user_id text,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  source_url text,
  status text not null default 'open'
    check (status in ('open', 'qualified', 'converted', 'closed', 'spam')),
  qualification_score integer,
  contact_id uuid references public.contacts(id) on delete set null,
  meta jsonb,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
-- Кодът прави .eq("session_id", …).maybeSingle() — дубликат би хвърлил грешка.
create unique index if not exists chatbot_conversations_session_id_key
  on public.chatbot_conversations (session_id);
-- Messenger ключът е (страница, PSID), също през maybeSingle().
create unique index if not exists chatbot_conversations_page_user_key
  on public.chatbot_conversations (meta_page_id, external_user_id)
  where meta_page_id is not null and external_user_id is not null;
create index if not exists chatbot_conversations_last_message_idx
  on public.chatbot_conversations (last_message_at desc);
create index if not exists chatbot_conversations_channel_idx
  on public.chatbot_conversations (channel, status);
create index if not exists chatbot_conversations_contact_idx
  on public.chatbot_conversations (contact_id);

-- ── chatbot_messages ──────────────────────────────────────────────────────
create table if not exists public.chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chatbot_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  model text,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists chatbot_messages_conversation_idx
  on public.chatbot_messages (conversation_id, created_at);

-- ── chatbot_knowledge ─────────────────────────────────────────────────────
create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'site_chatbot',
  title text not null,
  answer text not null,
  priority integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chatbot_knowledge_scope_idx
  on public.chatbot_knowledge (scope, enabled, priority desc);

-- ── demo_sessions ─────────────────────────────────────────────────────────
create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  expires_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists demo_sessions_created_idx on public.demo_sessions (created_at desc);

-- ── meta_campaigns_snapshot ───────────────────────────────────────────────
create table if not exists public.meta_campaigns_snapshot (
  id uuid primary key default gen_random_uuid(),
  ad_account_id text not null,
  ad_account_name text,
  campaign_id text not null,
  campaign_name text,
  objective text,
  status text,
  effective_status text,
  start_time timestamptz,
  amount_spent numeric(14, 2),
  amount_spent_cents bigint,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  clicks bigint not null default 0,
  leads bigint not null default 0,
  ctr_pct double precision,
  cpm_usd double precision,
  cpl_usd double precision,
  date_range_start date,
  date_range_end date,
  currency text,
  synced_at timestamptz not null default now()
);
-- Един ред на кампания — новият sync ъпдейтва същия ред.
create unique index if not exists meta_campaigns_snapshot_campaign_key
  on public.meta_campaigns_snapshot (ad_account_id, campaign_id);
create index if not exists meta_campaigns_snapshot_leads_idx
  on public.meta_campaigns_snapshot (leads desc);

-- ── whatsapp_accounts / whatsapp_conversations ────────────────────────────
create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  display_name text,
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'error', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.whatsapp_accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  customer_phone text not null,
  customer_name text,
  status text not null default 'open'
    check (status in ('open', 'qualified', 'converted', 'closed', 'spam')),
  unread_count integer not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_conversations_last_message_idx
  on public.whatsapp_conversations (last_message_at desc);
create unique index if not exists whatsapp_conversations_account_phone_key
  on public.whatsapp_conversations (account_id, customer_phone);

-- ── updated_at триггери ───────────────────────────────────────────────────
drop trigger if exists meta_pages_set_updated_at on public.meta_pages;
create trigger meta_pages_set_updated_at before update on public.meta_pages
  for each row execute function public.set_updated_at();

drop trigger if exists chatbot_knowledge_set_updated_at on public.chatbot_knowledge;
create trigger chatbot_knowledge_set_updated_at before update on public.chatbot_knowledge
  for each row execute function public.set_updated_at();

drop trigger if exists whatsapp_accounts_set_updated_at on public.whatsapp_accounts;
create trigger whatsapp_accounts_set_updated_at before update on public.whatsapp_accounts
  for each row execute function public.set_updated_at();

-- ── RLS: всичко минава през service role; админът чете през сесия ─────────
alter table public.meta_pages enable row level security;
alter table public.chatbot_conversations enable row level security;
alter table public.chatbot_messages enable row level security;
alter table public.chatbot_knowledge enable row level security;
alter table public.demo_sessions enable row level security;
alter table public.meta_campaigns_snapshot enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.whatsapp_conversations enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'meta_pages', 'chatbot_conversations', 'chatbot_messages', 'chatbot_knowledge',
    'demo_sessions', 'meta_campaigns_snapshot', 'whatsapp_accounts', 'whatsapp_conversations'
  ]
  loop
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated '
      'using (public.is_admin_email((auth.jwt() ->> ''email'')::text)) '
      'with check (public.is_admin_email((auth.jwt() ->> ''email'')::text))', t);
  end loop;
end$$;
