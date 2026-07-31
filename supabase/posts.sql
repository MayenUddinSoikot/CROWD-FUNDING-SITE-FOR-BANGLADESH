-- ============================================================
-- Shohay: news / blog posts (admin-written)
-- Paste into Supabase → SQL Editor → Run, AFTER demo-donations.sql.
-- Safe to run once.
-- ============================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_bn text,
  excerpt text,
  body text,
  body_bn text,
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- Anyone can read published posts.
create policy "Anyone reads published posts"
  on public.posts for select
  using (published = true);

-- Admins can do everything (write, edit, read drafts).
create policy "Admins manage posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());
