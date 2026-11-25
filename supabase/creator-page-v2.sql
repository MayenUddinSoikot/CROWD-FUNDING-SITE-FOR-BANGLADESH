-- ============================================================
-- Creator page, second pass — cover image and locked post teasers
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- A wide banner across the top of a creator page.
alter table public.profiles
  add column if not exists cover_url text;

-- Column order changes, so the view is dropped rather than replaced.
drop view if exists public.public_creators;

create view public.public_creators
with (security_invoker = off) as
  select id, username, display_name, bio, avatar_url, cover_url, social_links
  from public.profiles
  where username is not null;

grant select on public.public_creators to anon, authenticated;

-- Every post a creator has written, with the members-only ones shown as
-- locked teasers rather than hidden. Seeing what you are missing is what
-- makes someone join; hiding it entirely means they never learn there is
-- anything to join for.
--
-- Only the title and date escape. The body, photo and video of a locked
-- post are replaced with null here, not merely hidden in the page, so
-- there is nothing to find by reading the HTML.
create or replace view public.public_creator_post_teasers
with (security_invoker = off) as
  select
    id,
    creator_id,
    title,
    case when members_only then null else body end as body,
    case when members_only then null else image_url end as image_url,
    case when members_only then null else video_url end as video_url,
    members_only as locked,
    created_at
  from public.creator_posts;

grant select on public.public_creator_post_teasers to anon, authenticated;

-- ---------- Creator focus, and publishing ----------
-- What this creator raises for — the equivalent of Patreon's "what do
-- you create?" step. Used to group creators on the directory.
alter table public.profiles
  add column if not exists focus text[];

-- A page stays unlisted until the creator chooses to publish it, so
-- nobody's half-built page is the first thing a donor sees.
alter table public.profiles
  add column if not exists page_published boolean not null default false;

-- Anyone who already picked a username had no publish step, so their
-- page stays visible.
update public.profiles
   set page_published = true
 where username is not null and page_published = false;

drop view if exists public.public_creators;

create view public.public_creators
with (security_invoker = off) as
  select id, username, display_name, bio, avatar_url, cover_url,
         social_links, focus
  from public.profiles
  where username is not null;

grant select on public.public_creators to anon, authenticated;
