-- ============================================================
-- Shohay: site media — photos and videos YOU add
-- Paste into Supabase → SQL Editor → Run. Safe to run once.
--
-- Lets an admin put pictures and videos on the homepage (and
-- other pages later) without a developer. Two slots to start:
--   'hero'     — the big picture/video beside the headline
--   'featured' — the "Stories from Shohay" strip
-- ============================================================

create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  slot text not null default 'featured',
  media_type text not null default 'image',  -- image | video | youtube
  url text not null,
  title text,
  subtitle text,
  link_url text,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.site_media enable row level security;

-- Visitors see published items only.
drop policy if exists "Anyone can view published site media" on public.site_media;
create policy "Anyone can view published site media"
  on public.site_media for select
  using (published);

-- Admins add, edit and remove them.
drop policy if exists "Admins manage site media" on public.site_media;
create policy "Admins manage site media"
  on public.site_media for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists site_media_slot_idx
  on public.site_media (slot, position);
