-- ============================================================
-- Shohay: creator page — social links + monthly support intent
-- Paste into Supabase → SQL Editor → Run. Safe to run once.
--
-- 1) Social links live on the creator's PROFILE, so their page
--    shows Facebook / Instagram / YouTube / TikTok wherever it
--    appears — not just on one campaign.
-- 2) Supporters can tick "make this monthly"; we record that
--    intent now and start real recurring billing with SSLCommerz.
-- ============================================================

-- ---------- 1) Social links on the profile ----------
alter table public.profiles add column if not exists social_links jsonb;

-- Rebuild the public view so the new column is readable publicly.
create or replace view public.public_creators
with (security_invoker = off) as
  select id, username, display_name, bio, avatar_url, social_links
  from public.profiles
  where username is not null;

grant select on public.public_creators to anon, authenticated;

-- ---------- 2) Monthly support intent ----------
alter table public.donations
  add column if not exists is_monthly boolean not null default false;
