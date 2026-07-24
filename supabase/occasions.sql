-- ============================================================
-- Shohay: occasion fundraisers + creator "buy me a cha" pages
-- Paste into Supabase → SQL Editor → Run, AFTER media.sql.
-- Safe to run once.
-- ============================================================

-- 'standard' (a normal/occasion campaign) or 'creator' (ongoing support).
alter table public.campaigns
  add column if not exists campaign_type text not null default 'standard';

-- Optional occasion tag for standard campaigns (birthday, wedding, etc.).
alter table public.campaigns
  add column if not exists occasion text;
