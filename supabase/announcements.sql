-- ============================================================
-- Shohay: header announcement bar
-- Paste into Supabase → SQL Editor → Run. Safe to run once.
--
-- Short lines that rotate at the very top of every page, the way
-- kalonbd.com does it. Edited from Admin → Announcements.
-- Tone 'urgent' turns the bar red — use it only for real appeals.
-- ============================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  message_bn text,
  link_url text,
  tone text not null default 'normal',   -- normal | urgent
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

drop policy if exists "Anyone can view published announcements" on public.announcements;
create policy "Anyone can view published announcements"
  on public.announcements for select
  using (published);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists announcements_position_idx
  on public.announcements (published, position);

-- ---------- The three starting messages ----------
insert into public.announcements (message, message_bn, link_url, tone, position)
select * from (values
  (
    '0% platform fee — every taka reaches the campaign',
    '০% প্ল্যাটফর্ম ফি — প্রতিটি টাকা ক্যাম্পেইনে পৌঁছায়',
    '/about#fee',
    'normal',
    0
  ),
  (
    'Every campaign verified before it goes live',
    'প্রতিটি ক্যাম্পেইন যাচাই করে প্রকাশ করা হয়',
    '/about#safety',
    'normal',
    1
  ),
  (
    'Support a creator, or raise on your birthday for someone in need',
    'ক্রিয়েটরকে সাপোর্ট করুন বা জন্মদিনে অন্যের জন্য তহবিল তুলুন',
    '/creators',
    'normal',
    2
  )
) as seed(message, message_bn, link_url, tone, position)
where not exists (select 1 from public.announcements);
