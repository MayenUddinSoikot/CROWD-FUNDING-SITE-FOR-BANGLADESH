-- ============================================================
-- Shohay database schema — Day 3
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run once on a fresh project.
-- ============================================================

-- ---------- Types ----------
create type campaign_status as enum ('draft', 'pending', 'approved', 'rejected', 'completed');
create type donation_status as enum ('initiated', 'paid', 'failed', 'refunded');
create type campaign_category as enum ('medical', 'education', 'disaster_relief', 'community', 'other');

-- ---------- Profiles (one row per signed-up user) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Campaigns ----------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_bn text,
  summary text,
  summary_bn text,
  story text,
  story_bn text,
  category campaign_category not null default 'other',
  goal_amount numeric(12, 2) not null check (goal_amount > 0),
  raised_amount numeric(12, 2) not null default 0,
  status campaign_status not null default 'draft',
  cover_image_url text,
  creator_id uuid references public.profiles (id) on delete set null,
  beneficiary_name text,
  district text,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.campaigns enable row level security;

create policy "Anyone can view approved or completed campaigns"
  on public.campaigns for select
  using (status in ('approved', 'completed'));

create policy "Creators can view their own campaigns"
  on public.campaigns for select
  using (auth.uid() = creator_id);

create policy "Signed-in users can create campaigns"
  on public.campaigns for insert
  with check (auth.uid() = creator_id and status in ('draft', 'pending'));

create policy "Creators can edit their own drafts"
  on public.campaigns for update
  using (auth.uid() = creator_id and status in ('draft', 'rejected'));

-- ---------- Donations ----------
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  donor_id uuid references public.profiles (id) on delete set null,
  donor_name text,
  donor_email text,
  donor_phone text,
  amount numeric(12, 2) not null check (amount > 0),
  status donation_status not null default 'initiated',
  is_anonymous boolean not null default false,
  message text,
  tran_id text unique,          -- our transaction id sent to SSLCommerz
  val_id text,                  -- SSLCommerz validation id
  payment_method text,          -- bKash / Nagad / card, as reported by SSLCommerz
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.donations enable row level security;

create policy "Donors can view their own donations"
  on public.donations for select
  using (auth.uid() = donor_id);

-- Note: inserts and status updates happen only from our server code
-- using the service role key, which bypasses RLS. No public write policies.

-- ---------- Public view of donations (hides emails/phones) ----------
create view public.public_donations
with (security_invoker = off) as
select
  d.id,
  d.campaign_id,
  case when d.is_anonymous then null else d.donor_name end as donor_name,
  d.amount,
  d.message,
  d.paid_at
from public.donations d
where d.status = 'paid';

grant select on public.public_donations to anon, authenticated;

-- ---------- Keep raised_amount correct automatically ----------
create or replace function public.refresh_campaign_raised()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.campaign_id, old.campaign_id);
  update public.campaigns c
  set raised_amount = coalesce(
    (select sum(amount) from public.donations
     where campaign_id = target and status = 'paid'), 0)
  where c.id = target;
  return null;
end;
$$;

create trigger on_donation_change
  after insert or update of status or delete on public.donations
  for each row execute function public.refresh_campaign_raised();

-- ---------- Realtime (for the live donation counter, Day 6) ----------
alter publication supabase_realtime add table public.campaigns;

-- ---------- Helpful indexes ----------
create index campaigns_status_idx on public.campaigns (status);
create index donations_campaign_idx on public.donations (campaign_id, status);
