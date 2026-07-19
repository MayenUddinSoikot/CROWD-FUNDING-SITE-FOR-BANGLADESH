-- ============================================================
-- Shohay admin access — Day 10
-- Paste into Supabase → SQL Editor → Run, AFTER schema.sql.
-- Lets a user whose profile has is_admin = true review, approve,
-- and reject any campaign. Safe to run once.
-- ============================================================

-- A helper that answers "is the current user an admin?" without tripping
-- over row-level security. SECURITY DEFINER lets it read the profiles
-- table directly, so we avoid any policy-recursion surprises.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Admins can see every campaign, in any status (pending, rejected, etc.).
create policy "Admins can view all campaigns"
  on public.campaigns for select
  using (public.is_admin());

-- Admins can change any campaign — this is what approve/reject uses.
create policy "Admins can update any campaign"
  on public.campaigns for update
  using (public.is_admin());

-- Admins can also see every donation (for verifying totals later).
create policy "Admins can view all donations"
  on public.donations for select
  using (public.is_admin());

-- ---------- Make YOURSELF an admin ----------
-- Replace the email below with the one you used to create your login
-- in Authentication → Users, then run this line.
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'REPLACE_WITH_YOUR_EMAIL');
