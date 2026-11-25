-- ============================================================
-- Referral attribution — "you raised ৳47,000 for this family"
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
-- Every creator gets a personal link:
--   shohay.org/campaigns/karim-needs-help?via=rafsan
-- The username is remembered in a cookie for 30 days, and any
-- donation made in that window is credited to them. Last touch wins,
-- which is the usual rule and the one creators expect.
-- ============================================================

-- ---------- 1) Who sent this donation ----------
alter table public.donations
  add column if not exists referrer_id uuid
    references public.profiles (id) on delete set null,
  -- Kept alongside the id so the credit survives a profile being
  -- deleted or a username being changed.
  add column if not exists referrer_username text;

create index if not exists donations_referrer_idx
  on public.donations (referrer_id)
  where referrer_id is not null;

-- ---------- 2) The leaderboard ----------
-- A function rather than a view, because the board is always asked for
-- a period: this week, this month, all time.
create or replace function public.referrer_leaderboard(
  since timestamptz default null,
  max_rows integer default 50
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  donation_count bigint,
  supporters bigint,
  total_raised numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    count(d.id) as donation_count,
    count(distinct coalesce(d.donor_email, d.donor_phone, d.id::text))
      as supporters,
    coalesce(sum(d.amount), 0) as total_raised
  from public.profiles p
  join public.donations d
    on d.referrer_id = p.id
   and d.status = 'paid'
   and (since is null or d.paid_at >= since)
  where p.username is not null
  group by p.id, p.username, p.display_name, p.avatar_url
  having coalesce(sum(d.amount), 0) > 0
  order by coalesce(sum(d.amount), 0) desc
  limit greatest(1, least(coalesce(max_rows, 50), 100));
$$;

grant execute on function public.referrer_leaderboard(timestamptz, integer)
  to anon, authenticated;

-- ---------- 3) "How much have I brought in?" ----------
-- Only ever reports on the caller's own account.
create or replace function public.my_referral_stats(
  since timestamptz default null
)
returns table (
  total_raised numeric,
  donation_count bigint,
  supporters bigint,
  campaigns_helped bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(d.amount), 0) as total_raised,
    count(d.id) as donation_count,
    count(distinct coalesce(d.donor_email, d.donor_phone, d.id::text))
      as supporters,
    count(distinct d.campaign_id) as campaigns_helped
  from public.donations d
  where d.referrer_id = auth.uid()
    and d.status = 'paid'
    and (since is null or d.paid_at >= since);
$$;

grant execute on function public.my_referral_stats(timestamptz)
  to authenticated;

-- ---------- 4) Which campaigns did I raise the most for? ----------
create or replace function public.my_referral_campaigns(
  max_rows integer default 20
)
returns table (
  campaign_id uuid,
  slug text,
  title text,
  cover_image_url text,
  donation_count bigint,
  total_raised numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.slug,
    c.title,
    c.cover_image_url,
    count(d.id) as donation_count,
    coalesce(sum(d.amount), 0) as total_raised
  from public.donations d
  join public.campaigns c on c.id = d.campaign_id
  where d.referrer_id = auth.uid()
    and d.status = 'paid'
  group by c.id, c.slug, c.title, c.cover_image_url
  order by coalesce(sum(d.amount), 0) desc
  limit greatest(1, least(coalesce(max_rows, 20), 100));
$$;

grant execute on function public.my_referral_campaigns(integer)
  to authenticated;
