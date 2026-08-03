-- ============================================================
-- Shohay: social media links on campaigns
-- Paste into Supabase → SQL Editor → Run.
-- Lets creator fundraisers show their Facebook / Instagram /
-- YouTube / TikTok links publicly on the campaign page.
-- Safe to run once.
-- ============================================================

alter table public.campaigns
  add column if not exists social_links jsonb;
