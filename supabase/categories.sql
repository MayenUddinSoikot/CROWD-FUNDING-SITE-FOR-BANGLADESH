-- ============================================================
-- Shohay: more professional campaign categories
-- Paste into Supabase → SQL Editor → Run, AFTER creator-cycles.sql.
-- Adds new values to the campaign_category type. Safe to run once.
-- ============================================================

alter type campaign_category add value if not exists 'emergency';
alter type campaign_category add value if not exists 'creator';
alter type campaign_category add value if not exists 'arts';
alter type campaign_category add value if not exists 'religious';
alter type campaign_category add value if not exists 'animal';
alter type campaign_category add value if not exists 'environment';
alter type campaign_category add value if not exists 'sports';
alter type campaign_category add value if not exists 'memorial';
