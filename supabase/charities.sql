-- ============================================================
-- Shohay: verified charities + per-campaign charity split
-- Paste into Supabase → SQL Editor → Run, AFTER occasions.sql.
-- Occasion/birthday fundraisers send money to verified charities
-- (not the organizer), optionally split across several by %.
-- Safe to run once.
-- ============================================================

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  -- payout details (private — admins only)
  bkash_number text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  is_verified boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.charities enable row level security;

-- Only admins can see/manage the full charities table (incl. payout).
create policy "Admins manage charities"
  on public.charities for all
  using (public.is_admin())
  with check (public.is_admin());

-- A public view exposes only safe fields (name/description/logo).
create view public.public_charities
with (security_invoker = off) as
  select id, name, description, logo_url
  from public.charities
  where is_verified = true;

grant select on public.public_charities to anon, authenticated;

-- Which charities a campaign supports, and each one's share (%).
create table if not exists public.campaign_charities (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  charity_id uuid not null references public.charities (id),
  percentage numeric(5, 2) not null default 100,
  created_at timestamptz not null default now()
);

alter table public.campaign_charities enable row level security;

create policy "Anyone reads allocations of public campaigns"
  on public.campaign_charities for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.status in ('approved', 'completed')
    )
  );

create policy "Owners read own allocations"
  on public.campaign_charities for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Owners insert own allocations"
  on public.campaign_charities for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

create policy "Admins read all allocations"
  on public.campaign_charities for select
  using (public.is_admin());

-- A few starter charities so occasion fundraisers work right away.
-- Replace/add your own real, vetted charities in the admin panel.
insert into public.charities (name, description)
values
  ('Bidyanondo Foundation', 'Food, education and humanitarian relief'),
  ('JAAGO Foundation', 'Free education for underprivileged children'),
  ('BRAC', 'Poverty alleviation and community development')
on conflict do nothing;
