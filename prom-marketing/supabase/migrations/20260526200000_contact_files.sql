-- File attachments per contact — archive of everything sent/received per client.
-- Storage goes to Supabase Storage; this table tracks metadata.

create table if not exists public.contact_files (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  filename text not null,              -- display name
  storage_path text not null,          -- path in supabase storage bucket
  size_bytes bigint not null default 0,
  mime_type text,
  category text,                       -- 'oferta', 'dogovor', 'invoice', 'image', 'document', 'other'
  description text,                    -- optional note from uploader
  uploaded_by text,                    -- email of admin who uploaded
  uploaded_at timestamptz not null default now()
);

create index if not exists contact_files_contact_id_idx on public.contact_files (contact_id, uploaded_at desc);

-- Public read disabled, service-role-only access through API.
alter table public.contact_files enable row level security;

-- No public policies — all access via service client behind /api/admin/* routes.

-- Storage bucket setup (idempotent):
-- Bucket name: 'contact-files' · private (not public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-files',
  'contact-files',
  false,
  52428800,  -- 50 MB per file
  null       -- allow any MIME type
)
on conflict (id) do nothing;
