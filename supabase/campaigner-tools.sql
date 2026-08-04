-- ============================================================
-- Shohay: campaigner dashboard + admin analytics
-- Paste into Supabase → SQL Editor → Run. Safe to run once.
--
-- 1) Campaigners can edit their goal amount (safely — nothing else)
-- 2) Campaign updates can carry a photo and/or a video link
-- 3) Page-view tracking for the admin analytics dashboard
-- ============================================================

-- ---------- 1) Safe goal editing ----------
-- SECURITY DEFINER so the owner can change ONLY the goal amount of
-- ONLY their own campaign — no other column can be touched this way.
create or replace function public.update_my_goal(campaign uuid, new_goal numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_goal is null or new_goal <= 0 or new_goal > 100000000 then
    raise exception 'Invalid goal amount';
  end if;
  update public.campaigns
     set goal_amount = new_goal
   where id = campaign
     and creator_id = auth.uid();
end;
$$;

grant execute on function public.update_my_goal(uuid, numeric) to authenticated;

-- ---------- 2) Updates with photo / video ----------
alter table public.campaign_updates add column if not exists image_url text;
alter table public.campaign_updates add column if not exists video_url text;

-- ---------- 3) Page views for analytics ----------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  campaign_id uuid references public.campaigns (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

drop policy if exists "Anyone can record a view" on public.page_views;
create policy "Anyone can record a view"
  on public.page_views for insert
  with check (true);

drop policy if exists "Admins can read views" on public.page_views;
create policy "Admins can read views"
  on public.page_views for select
  using (public.is_admin());

create index if not exists page_views_campaign_idx
  on public.page_views (campaign_id, created_at);
