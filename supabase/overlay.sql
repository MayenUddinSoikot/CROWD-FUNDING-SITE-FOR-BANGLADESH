-- ============================================================
-- Live donation alerts for streamers
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
-- A creator drops one URL into OBS as a Browser Source and every
-- donation to their campaigns pops up on screen while they stream.
-- The URL contains a secret key, so it can be shown to a camera
-- without giving anything away — it exposes only what is already
-- public on the campaign page: a first name, an amount, a message.
-- ============================================================

-- ---------- 1) The secret key in the overlay URL ----------
alter table public.profiles
  add column if not exists overlay_key text;

update public.profiles
   set overlay_key = replace(gen_random_uuid()::text, '-', '')
 where overlay_key is null;

create unique index if not exists profiles_overlay_key_idx
  on public.profiles (overlay_key);

alter table public.profiles
  alter column overlay_key
  set default replace(gen_random_uuid()::text, '-', '');

-- New sign-ups get one too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name),
        phone = coalesce(public.profiles.phone, excluded.phone);
  return new;
end;
$$;

-- ---------- 2) What the overlay is allowed to see ----------
-- Donor email and phone are never returned. An anonymous gift comes
-- back as "Someone", exactly as it reads on the campaign page.
create or replace function public.overlay_feed(
  overlay_key text,
  since timestamptz default null
)
returns table (
  id uuid,
  donor text,
  amount numeric,
  message text,
  campaign_title text,
  paid_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    case
      when d.is_anonymous or coalesce(trim(d.donor_name), '') = ''
        then 'Someone'
      else d.donor_name
    end as donor,
    d.amount,
    d.message,
    c.title as campaign_title,
    d.paid_at
  from public.donations d
  join public.campaigns c on c.id = d.campaign_id
  join public.profiles p on p.id = c.creator_id
  where length(coalesce(overlay_feed.overlay_key, '')) >= 24
    and p.overlay_key = overlay_feed.overlay_key
    and d.status = 'paid'
    and d.paid_at is not null
    and (since is null or d.paid_at > since)
  order by d.paid_at asc
  limit 25;
$$;

grant execute on function public.overlay_feed(text, timestamptz)
  to anon, authenticated;

-- ---------- 3) Running totals for the on-screen bar ----------
create or replace function public.overlay_totals(overlay_key text)
returns table (
  raised_today numeric,
  raised_total numeric,
  supporters_today bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(d.amount) filter (
      where d.paid_at >= date_trunc('day', now() at time zone 'Asia/Dhaka')
    ), 0) as raised_today,
    coalesce(sum(d.amount), 0) as raised_total,
    count(*) filter (
      where d.paid_at >= date_trunc('day', now() at time zone 'Asia/Dhaka')
    ) as supporters_today
  from public.donations d
  join public.campaigns c on c.id = d.campaign_id
  join public.profiles p on p.id = c.creator_id
  where length(coalesce(overlay_totals.overlay_key, '')) >= 24
    and p.overlay_key = overlay_totals.overlay_key
    and d.status = 'paid';
$$;

grant execute on function public.overlay_totals(text) to anon, authenticated;

-- ---------- 4) The creator's own key, for the account page ----------
create or replace function public.my_overlay_key()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select overlay_key from public.profiles where id = auth.uid();
$$;

grant execute on function public.my_overlay_key() to authenticated;
