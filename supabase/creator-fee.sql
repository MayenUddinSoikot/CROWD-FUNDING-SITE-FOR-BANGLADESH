-- The dashboard and the payouts page have to show what actually reaches
-- someone, and that now depends on whether a campaign is a creator
-- project (Shohay keeps 15%) or a fundraiser (Shohay keeps nothing).
-- Return the type so the app can do that sum per campaign rather than
-- applying one rate to a mixed total.

drop function if exists public.my_campaign_dashboard();

create function public.my_campaign_dashboard()
returns table(
  campaign_id uuid,
  slug text,
  title text,
  status text,
  campaign_no bigint,
  campaign_type text,
  goal_amount numeric,
  raised_amount numeric,
  created_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_recurring boolean,
  views bigint,
  views_7d bigint,
  donations bigint,
  donors bigint,
  biggest_gift numeric,
  last_gift_at timestamp with time zone
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    c.id,
    c.slug,
    c.title,
    c.status::text,
    c.campaign_no,
    coalesce(c.campaign_type, 'standard')::text,
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
$function$;
