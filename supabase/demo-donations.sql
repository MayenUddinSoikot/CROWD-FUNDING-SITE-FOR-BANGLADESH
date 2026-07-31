-- ============================================================
-- Shohay: DEMO donations (until SSLCommerz is connected)
-- Paste into Supabase → SQL Editor → Run, AFTER charities.sql.
--
-- While there is no real payment gateway, this lets a donation be
-- recorded as 'paid' so the message and live counter show during
-- testing. When SSLCommerz goes live, only the verified payment
-- callback will mark a donation 'paid' — revert this then.
-- Safe to run once.
-- ============================================================

alter policy "Anyone can start a donation"
  on public.donations
  with check (status in ('initiated', 'paid'));

-- Make the recent-donations list update live too.
alter publication supabase_realtime add table public.donations;
