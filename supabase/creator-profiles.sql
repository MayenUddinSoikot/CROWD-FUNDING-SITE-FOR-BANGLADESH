-- ============================================================
-- Shohay: public creator profiles
-- Paste into Supabase → SQL Editor → Run, AFTER categories.sql.
-- Adds a username/bio/avatar to profiles and a public view so a
-- creator can have a shareable profile page at /creator/<username>.
-- Safe to run once.
-- ============================================================

alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;

-- Public view: only safe, opted-in profile fields (those with a username).
create or replace view public.public_creators
with (security_invoker = off) as
  select id, username, display_name, bio, avatar_url
  from public.profiles
  where username is not null;

grant select on public.public_creators to anon, authenticated;
