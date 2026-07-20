-- ============================================================
-- Shohay: campaign media gallery (photos + video / YouTube)
-- Paste into Supabase → SQL Editor → Run, AFTER tips.sql.
-- Safe to run once.
-- ============================================================

-- Let the public media bucket hold images as well as video.
update storage.buckets
set allowed_mime_types = array[
  'video/mp4', 'video/webm', 'video/quicktime',
  'image/jpeg', 'image/png', 'image/webp'
]
where id = 'campaign-media';

create table if not exists public.campaign_media (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  media_type text not null,          -- 'image' | 'video' | 'youtube'
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.campaign_media enable row level security;

-- Anyone can see media on a public campaign.
create policy "Anyone can view media of public campaigns"
  on public.campaign_media for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.status in ('approved', 'completed')
    )
  );

-- Creators can see + add media on their own campaign.
create policy "Owners view own campaign media"
  on public.campaign_media for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Owners insert own campaign media"
  on public.campaign_media for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Admins view all campaign media"
  on public.campaign_media for select
  using (public.is_admin());
