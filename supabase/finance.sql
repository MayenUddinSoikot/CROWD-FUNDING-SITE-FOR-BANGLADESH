-- ============================================================
-- Shohay: finance dashboard + creator directory
-- Paste into Supabase → SQL Editor → Run. Safe to run once.
--
-- 1) payouts table — admins record money sent to campaigners,
--    so the dashboard can show paid-out vs still-owed
-- 2) Admins can read all profiles (creator directory)
-- ============================================================

-- ---------- 1) Payouts ----------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

drop policy if exists "Admins manage payouts" on public.payouts;
create policy "Admins manage payouts"
  on public.payouts for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists payouts_campaign_idx
  on public.payouts (campaign_id, paid_at);

-- ---------- 2) Creator directory ----------
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());
