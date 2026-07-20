-- ============================================================
-- Shohay: optional donor tip to support the platform (0% fee model)
-- Paste into Supabase → SQL Editor → Run, AFTER organizer.sql.
-- Safe to run once.
-- ============================================================

alter table public.donations
  add column if not exists tip_amount numeric(12, 2) not null default 0;
