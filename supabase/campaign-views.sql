-- ============================================================
-- Campaign views, and the numbers behind the creator dashboard
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
-- One row per campaign per day rather than one row per visit: a busy
-- campaign would otherwise write millions of rows nobody ever reads
-- individually, and a daily count is all the dashboard shows.
-- ============================================================

create table if not exists public.campaign_views (
  campaign_id uuid not null
    references public.campaigns (id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Dhaka')::date),
  views bigint not null default 0,
  primary key (campaign_id, day)
);

-- Nobody reads or writes this table directly; everything goes through
-- the two functions below.
alter table public.campaign_views enable row level security;

-- ---------- Counting a view ----------
-- The parameter is prefixed because a bare campaign_id is ambiguous
-- inside "on conflict (campaign_id, day)" — Postgres cannot tell the
-- parameter from the column, and the whole insert fails.
create or replace function public.record_campaign_view(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_views (campaign_id, day, views)
  values (p_campaign_id, (now() at time zone 'Asia/Dhaka')::date, 1)
  on conflict (campaign_id, day)
  do update set views = public.campaign_views.views + 1;
exception
  -- A view of a campaign that no longer exists is not worth an error.
  when foreign_key_violation then return;
end;
$$;

grant execute on function public.record_campaign_view(uuid)
  to anon, authenticated;

-- ---------- The dashboard ----------
-- Deliberately returns no tip figures. Tips are Shohay's, not the
-- campaigner's, and showing them next to their own total would only
-- confuse what they are owed.
create or replace function public.my_campaign_dashboard()
returns table (
  campaign_id uuid,
  slug text,
  title text,
  status text,
  campaign_no bigint,
  goal_amount numeric,
  raised_amount numeric,
  created_at timestamptz,
  ends_at timestamptz,
  is_recurring boolean,
  views bigint,
  views_7d bigint,
  donations bigint,
  donors bigint,
  biggest_gift numeric,
  last_gift_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.slug,
    c.title,
    c.status::text,
    c.campaign_no,
    c.goal_amount,
    c.raised_amount,
    c.created_at,
    c.ends_at,
    c.is_recurring,
    coalesce(v.total, 0),
    coalesce(v7.total, 0),
    coalesce(d.donations, 0),
    coalesce(d.donors, 0),
    coalesce(d.biggest, 0),
    d.last_at
  from public.campaigns c
  left join lateral (
    select sum(cv.views) as total
    from public.campaign_views cv
    where cv.campaign_id = c.id
  ) v on true
  left join lateral (
    select sum(cv.views) as total
    from public.campaign_views cv
    where cv.campaign_id = c.id
      and cv.day >= ((now() at time zone 'Asia/Dhaka')::date - 6)
  ) v7 on true
  left join lateral (
    select
      count(*) as donations,
      count(distinct coalesce(dd.donor_email, dd.donor_phone, dd.id::text))
        as donors,
      max(dd.amount) as biggest,
      max(dd.paid_at) as last_at
    from public.donations dd
    where dd.campaign_id = c.id and dd.status = 'paid'
  ) d on true
  where c.creator_id = auth.uid()
  order by c.created_at desc;
$$;

grant execute on function public.my_campaign_dashboard() to authenticated;
