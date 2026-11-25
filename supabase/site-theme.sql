-- ============================================================
-- Shohay: editable homepage — uploads + every word in the database
-- Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- ============================================================

-- 1. A bucket for homepage photos and video. Public to read, because
--    the homepage shows it to strangers; only admins may write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  104857600,                                   -- 100 MB, for a short hero clip
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view site media" on storage.objects;
create policy "Anyone can view site media"
  on storage.objects for select
  using (bucket_id = 'site-media');

drop policy if exists "Admins upload site media" on storage.objects;
create policy "Admins upload site media"
  on storage.objects for insert
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "Admins replace site media" on storage.objects;
create policy "Admins replace site media"
  on storage.objects for update
  using (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "Admins delete site media" on storage.objects;
create policy "Admins delete site media"
  on storage.objects for delete
  using (bucket_id = 'site-media' and public.is_admin());

-- 2. Every piece of text on the homepage, keyed, so it can be changed
--    without a deploy. A missing row means "use the wording shipped in
--    the code", so the site reads correctly before anything is set and
--    an admin can always clear a field to get the original back.
create table if not exists public.site_content (
  key         text primary key,
  value       text,
  value_bn    text,
  updated_at  timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content for select
  using (true);

drop policy if exists "Admins change site content" on public.site_content;
create policy "Admins change site content"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Sections can be switched off entirely without deleting their words.
create table if not exists public.site_sections (
  key        text primary key,
  visible    boolean not null default true,
  position   int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.site_sections enable row level security;

drop policy if exists "Anyone can read site sections" on public.site_sections;
create policy "Anyone can read site sections"
  on public.site_sections for select
  using (true);

drop policy if exists "Admins change site sections" on public.site_sections;
create policy "Admins change site sections"
  on public.site_sections for all
  using (public.is_admin())
  with check (public.is_admin());
