-- ============================================================
-- Shohay: campaign video, duration, live updates, donation start
-- Paste into Supabase → SQL Editor → Run, AFTER documents.sql.
-- Safe to run once.
-- ============================================================

-- ---------- Campaign video (public) ----------
alter table public.campaigns add column if not exists video_url text;

-- A PUBLIC bucket for campaign videos (these are meant to be seen by donors).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-media',
  'campaign-media',
  true,                                    -- public: anyone can watch
  52428800,                                -- 50 MB per file
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

create policy "Anyone can view campaign media"
  on storage.objects for select
  using (bucket_id = 'campaign-media');

create policy "Owners upload own campaign media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Live updates under a campaign ----------
create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.campaign_updates enable row level security;

-- Anyone can read updates on a public campaign.
create policy "Anyone can read updates of public campaigns"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.status in ('approved', 'completed')
    )
  );

-- Creators can read + post updates on their own campaign.
create policy "Creators read own updates"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Creators post updates"
  on public.campaign_updates for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

-- Admins can read + post updates on any campaign.
create policy "Admins read all updates"
  on public.campaign_updates for select
  using (public.is_admin());

create policy "Admins post any update"
  on public.campaign_updates for insert
  with check (public.is_admin());

alter publication supabase_realtime add table public.campaign_updates;

-- ---------- Let donors start a donation ----------
-- Only lets the public create a donation in the 'initiated' state. The
-- payment gateway (added on Days 8-9, server-side) is what flips it to
-- 'paid' after verifying the money actually arrived.
create policy "Anyone can start a donation"
  on public.donations for insert
  with check (status = 'initiated');
