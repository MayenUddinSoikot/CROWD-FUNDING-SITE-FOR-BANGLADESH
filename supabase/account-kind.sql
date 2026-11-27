-- What an account raises as: a creator page with monthly supporters and
-- special projects, a fundraiser raising for people and causes, or an
-- occasion fundraiser for a verified charity.
--
-- It decides which questions the campaign form asks, so a creator is no
-- longer asked for a "beneficiary name" and their "relationship to the
-- beneficiary". Null means nobody has chosen yet — they are asked once,
-- on the way to their first campaign.

alter table public.profiles
  add column if not exists account_kind text;

alter table public.profiles
  drop constraint if exists profiles_account_kind_check;

alter table public.profiles
  add constraint profiles_account_kind_check
  check (account_kind is null or account_kind in ('creator', 'fundraiser', 'occasion'));

comment on column public.profiles.account_kind is
  'What this account raises as: creator (ongoing page + special projects), fundraiser (raises for people and causes), or occasion (birthday/wedding fundraisers for a charity). Null means not chosen yet.';
