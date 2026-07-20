-- ============================================================
-- Shohay: public organizer + relationship shown on the campaign
-- Paste into Supabase → SQL Editor → Run, AFTER features.sql.
-- These are PUBLIC fields (who is raising the campaign and how they
-- relate to the beneficiary), unlike the private verification table.
-- Safe to run once.
-- ============================================================

alter table public.campaigns
  add column if not exists organizer_name text;

alter table public.campaigns
  add column if not exists organizer_relationship text;
