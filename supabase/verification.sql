-- ============================================================
-- Shohay applicant verification + payout details
-- Paste into Supabase → SQL Editor → Run, AFTER admin-policies.sql.
-- Sensitive data (NID, contact, bank) lives in its own table with
-- NO public read policy — only the applicant and admins can ever see it.
-- Safe to run once.
-- ============================================================

create table if not exists public.campaign_verifications (
  campaign_id uuid primary key
    references public.campaigns (id) on delete cascade,
  applicant_name text,          -- who is submitting (may differ from beneficiary)
  applicant_nid text,           -- national ID number
  applicant_phone text,
  applicant_email text,
  relationship text,            -- relationship to the beneficiary
  bank_name text,
  bank_branch text,
  bank_account_name text,
  bank_account_number text,
  bkash_number text,            -- bKash / Nagad payout number
  notes text,                   -- anything else the applicant wants to add
  created_at timestamptz not null default now()
);

alter table public.campaign_verifications enable row level security;

-- The applicant who owns the campaign can add their own verification row...
create policy "Owners can insert their verification"
  on public.campaign_verifications for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

-- ...and read it back.
create policy "Owners can view their verification"
  on public.campaign_verifications for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

-- Admins can view every verification (this is the review dashboard).
create policy "Admins can view all verifications"
  on public.campaign_verifications for select
  using (public.is_admin());

-- Note: there is deliberately NO policy granting the public (anon) any
-- access. Donors can never read this table.
