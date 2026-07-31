-- ============================================================
-- Shohay: monthly (recurring) creator support pages
-- Paste into Supabase → SQL Editor → Run, AFTER posts.sql.
-- A recurring creator page runs in 30-day cycles: the shown total
-- counts only the current cycle, so it "resets to 0" each month
-- while the page keeps going.
-- Safe to run once.
-- ============================================================

alter table public.campaigns
  add column if not exists is_recurring boolean not null default false;
alter table public.campaigns
  add column if not exists cycle_days int not null default 30;
alter table public.campaigns
  add column if not exists cycle_anchor timestamptz;

-- Recompute raised_amount, cycle-aware for recurring campaigns.
create or replace function public.refresh_campaign_raised()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target uuid;
  rec record;
  cstart timestamptz;
  cycles_passed int;
begin
  target := coalesce(new.campaign_id, old.campaign_id);

  select is_recurring, cycle_days, cycle_anchor
    into rec
  from public.campaigns
  where id = target;

  if rec.is_recurring and rec.cycle_anchor is not null then
    cycles_passed := floor(
      extract(epoch from (now() - rec.cycle_anchor))
      / (rec.cycle_days * 86400)
    )::int;
    cstart := rec.cycle_anchor + (cycles_passed * rec.cycle_days) * interval '1 day';

    update public.campaigns c
    set raised_amount = coalesce(
      (select sum(amount) from public.donations
       where campaign_id = target and status = 'paid' and paid_at >= cstart), 0)
    where c.id = target;
  else
    update public.campaigns c
    set raised_amount = coalesce(
      (select sum(amount) from public.donations
       where campaign_id = target and status = 'paid'), 0)
    where c.id = target;
  end if;

  return null;
end;
$$;
