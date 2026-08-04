-- ============================================================
-- Shohay: "frozen" campaign status
-- Paste into Supabase → SQL Editor → Run.
-- Lets admins freeze a campaign (hidden from the public, funds
-- held) while an investigation happens. Safe to run once.
-- ============================================================

alter type campaign_status add value if not exists 'frozen';
