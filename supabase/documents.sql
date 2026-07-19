-- ============================================================
-- Shohay document vault — NID, medical reports, bank cheque, etc.
-- Paste into Supabase → SQL Editor → Run, AFTER verification.sql.
-- Files live in a PRIVATE storage bucket. Only the applicant who
-- uploaded them and admins can ever open them — never the public.
-- Safe to run once.
-- ============================================================

-- ---------- Private storage bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-docs',
  'campaign-docs',
  false,                                   -- NOT public
  10485760,                                -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Applicants can upload only into their own folder (named by their user id).
create policy "Owners upload own campaign docs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'campaign-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Applicants can read back their own uploads.
create policy "Owners read own campaign docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'campaign-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read every uploaded document (this is the review vault).
create policy "Admins read all campaign docs"
  on storage.objects for select to authenticated
  using (bucket_id = 'campaign-docs' and public.is_admin());

-- ---------- Table linking files to campaigns ----------
create table if not exists public.campaign_documents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  doc_type text not null,        -- 'nid' | 'medical' | 'cheque' | 'other'
  storage_path text not null,
  file_name text,
  created_at timestamptz not null default now()
);

alter table public.campaign_documents enable row level security;

create policy "Owners insert their campaign documents"
  on public.campaign_documents for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Owners view their campaign documents"
  on public.campaign_documents for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Admins view all campaign documents"
  on public.campaign_documents for select
  using (public.is_admin());
