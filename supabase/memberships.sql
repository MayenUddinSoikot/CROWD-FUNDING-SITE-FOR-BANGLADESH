-- ============================================================
-- Creator memberships — monthly support with tiers
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
-- Supporters do not have accounts on Shohay, and they shouldn't need
-- one. So a membership carries its own secret access_key, and that key
-- is the supporter's way back into the members-only posts — the same
-- idea as the streamer overlay link.
--
-- Nothing here charges anybody. bKash auto-debit needs a merchant
-- agreement, so a membership is a pledge with a due date until that
-- exists, and the creator is told as much.
-- ============================================================

-- ---------- 1) Tiers ----------
create table if not exists public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_bn text,
  amount numeric(12, 2) not null check (amount > 0),
  perks text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists membership_tiers_creator_idx
  on public.membership_tiers (creator_id, position);

alter table public.membership_tiers enable row level security;

drop policy if exists "Creators manage their own tiers" on public.membership_tiers;
create policy "Creators manage their own tiers"
  on public.membership_tiers for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create or replace view public.public_membership_tiers
with (security_invoker = off) as
  select id, creator_id, name, name_bn, amount, perks, position
  from public.membership_tiers
  where active;

grant select on public.public_membership_tiers to anon, authenticated;

-- ---------- 2) Memberships ----------
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  tier_id uuid references public.membership_tiers (id) on delete set null,
  supporter_name text,
  supporter_email text,
  supporter_phone text,
  amount numeric(12, 2) not null check (amount > 0),
  message text,
  is_public boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'cancelled')),
  access_key text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  started_at timestamptz not null default now(),
  next_due_at timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz
);

create index if not exists memberships_creator_idx
  on public.memberships (creator_id, status);

alter table public.memberships enable row level security;

-- Creators see their own supporters. Nobody else reads this table
-- directly — the public wall and the supporter's own page both go
-- through functions below, so emails and phone numbers never leave.
drop policy if exists "Creators see their own supporters" on public.memberships;
create policy "Creators see their own supporters"
  on public.memberships for select
  using (auth.uid() = creator_id);

-- ---------- 3) The public supporter wall ----------
create or replace view public.public_supporters
with (security_invoker = off) as
  select
    m.creator_id,
    coalesce(nullif(trim(m.supporter_name), ''), 'Someone') as supporter_name,
    t.name as tier_name,
    m.message,
    m.started_at
  from public.memberships m
  left join public.membership_tiers t on t.id = m.tier_id
  where m.status = 'active' and m.is_public;

grant select on public.public_supporters to anon, authenticated;

-- ---------- 4) Joining ----------
-- A function rather than an insert policy, so anonymous visitors can
-- join without being able to write anything else, and so the new
-- access_key comes straight back to the page that created it.
create or replace function public.join_membership(
  creator_username text,
  tier_id uuid,
  amount numeric,
  supporter_name text default null,
  supporter_email text default null,
  supporter_phone text default null,
  message text default null,
  is_public boolean default true
)
returns table (access_key text, next_due_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  final_amount numeric;
begin
  select p.id into target
  from public.profiles p
  where p.username = lower(trim(join_membership.creator_username));

  if target is null then
    raise exception 'creator not found';
  end if;

  -- A named tier sets the price; otherwise the supporter chose it.
  select t.amount into final_amount
  from public.membership_tiers t
  where t.id = join_membership.tier_id
    and t.creator_id = target
    and t.active;

  final_amount := coalesce(final_amount, join_membership.amount);

  if final_amount is null or final_amount < 10 then
    raise exception 'amount too small';
  end if;

  return query
  insert into public.memberships (
    creator_id, tier_id, supporter_name, supporter_email, supporter_phone,
    amount, message, is_public
  )
  values (
    target,
    join_membership.tier_id,
    nullif(trim(join_membership.supporter_name), ''),
    nullif(lower(trim(join_membership.supporter_email)), ''),
    nullif(trim(join_membership.supporter_phone), ''),
    final_amount,
    nullif(trim(join_membership.message), ''),
    coalesce(join_membership.is_public, true)
  )
  returning memberships.access_key, memberships.next_due_at;
end;
$$;

grant execute on function public.join_membership(
  text, uuid, numeric, text, text, text, text, boolean
) to anon, authenticated;

-- ---------- 5) Posts, some of them members-only ----------
create table if not exists public.creator_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  image_url text,
  video_url text,
  members_only boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists creator_posts_creator_idx
  on public.creator_posts (creator_id, created_at desc);

alter table public.creator_posts enable row level security;

drop policy if exists "Creators manage their own posts" on public.creator_posts;
create policy "Creators manage their own posts"
  on public.creator_posts for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create or replace view public.public_creator_posts
with (security_invoker = off) as
  select id, creator_id, title, body, image_url, video_url, created_at
  from public.creator_posts
  where not members_only;

grant select on public.public_creator_posts to anon, authenticated;

-- ---------- 6) What a supporter sees with their key ----------
create or replace function public.supporter_view(access_key text)
returns table (
  creator_username text,
  creator_name text,
  creator_avatar text,
  tier_name text,
  amount numeric,
  started_at timestamptz,
  next_due_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.username,
    coalesce(p.display_name, p.username),
    p.avatar_url,
    t.name,
    m.amount,
    m.started_at,
    m.next_due_at,
    m.status
  from public.memberships m
  join public.profiles p on p.id = m.creator_id
  left join public.membership_tiers t on t.id = m.tier_id
  where length(coalesce(supporter_view.access_key, '')) >= 24
    and m.access_key = supporter_view.access_key;
$$;

grant execute on function public.supporter_view(text) to anon, authenticated;

create or replace function public.supporter_posts(
  access_key text,
  max_rows integer default 30
)
returns table (
  id uuid,
  title text,
  body text,
  image_url text,
  video_url text,
  members_only boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.id, cp.title, cp.body, cp.image_url, cp.video_url,
    cp.members_only, cp.created_at
  from public.creator_posts cp
  join public.memberships m on m.creator_id = cp.creator_id
  where length(coalesce(supporter_posts.access_key, '')) >= 24
    and m.access_key = supporter_posts.access_key
    and m.status = 'active'
  order by cp.created_at desc
  limit greatest(1, least(coalesce(max_rows, 30), 100));
$$;

grant execute on function public.supporter_posts(text, integer)
  to anon, authenticated;

create or replace function public.cancel_membership(access_key text)
returns boolean
language sql
volatile
security definer
set search_path = public
as $$
  update public.memberships
     set status = 'cancelled', cancelled_at = now()
   where length(coalesce(cancel_membership.access_key, '')) >= 24
     and memberships.access_key = cancel_membership.access_key
     and status = 'active'
  returning true;
$$;

grant execute on function public.cancel_membership(text)
  to anon, authenticated;

-- ---------- 7) The creator's own numbers ----------
create or replace function public.my_membership_stats()
returns table (
  supporters bigint,
  monthly_total numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as supporters,
    coalesce(sum(amount), 0) as monthly_total
  from public.memberships
  where creator_id = auth.uid() and status = 'active';
$$;

grant execute on function public.my_membership_stats() to authenticated;
