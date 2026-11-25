import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, PublicCreator } from "@/lib/types";
import { SOCIAL_PLATFORMS } from "@/lib/types";
import { formatTaka } from "@/lib/format";
import { CampaignCard } from "@/components/CampaignCard";
import { CreatorSupportBox } from "@/components/CreatorSupportBox";
import { CreatorTabs } from "@/components/CreatorTabs";
import { PostCard } from "@/components/PostCard";
import { EmptyState, ButtonLink } from "@/components/ui";
import { SafeImage } from "@/components/SafeImage";
import {
  getTiers,
  getSupporters,
  getPostTeasers,
  type MembershipTier,
  type PublicSupporter,
  type PostTeaser,
} from "@/lib/memberships";

export const dynamic = "force-dynamic";

const CREATOR_FIELDS = "id, username, display_name, bio, avatar_url";

async function getCreator(username: string): Promise<PublicCreator | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    // cover_url / social_links each arrive with a later SQL script.
    const first = await supabase
      .from("public_creators")
      .select(`${CREATOR_FIELDS}, cover_url, social_links`)
      .eq("username", username)
      .maybeSingle();

    let data = first.data;
    let error = first.error;
    if (error) {
      const retry = await supabase
        .from("public_creators")
        .select(CREATOR_FIELDS)
        .eq("username", username)
        .maybeSingle();
      data = retry.data as unknown as typeof data;
      error = retry.error;
    }

    if (error) {
      console.error("Failed to load creator:", error.message);
      return null;
    }
    return data as PublicCreator | null;
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return null;
  }
}

const CAMPAIGN_FIELDS =
  "id, slug, title, title_bn, summary, category, goal_amount, raised_amount, status, cover_image_url, district, campaign_type, is_recurring, created_at";

async function getCreatorCampaigns(creatorId: string): Promise<Campaign[]> {
  try {
    const supabase = getSupabaseClient();
    const run = (fields: string) =>
      supabase
        .from("campaigns")
        .select(fields)
        .eq("creator_id", creatorId)
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false });

    let { data, error } = await run(`${CAMPAIGN_FIELDS}, social_links`);
    if (error) ({ data, error } = await run(CAMPAIGN_FIELDS));
    if (error) {
      console.error("Failed to load creator campaigns:", error.message);
      return [];
    }
    return (data ?? []) as unknown as Campaign[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return [];
  }
}

// The page supporters buy a cha on: their live creator page if they have
// one, otherwise whatever campaign of theirs is currently running.
function supportTarget(campaigns: Campaign[]): Campaign | null {
  const live = campaigns.filter((c) => c.status === "approved");
  return (
    live.find((c) => c.campaign_type === "creator" && c.is_recurring) ??
    live.find((c) => c.campaign_type === "creator") ??
    live[0] ??
    null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreator(username);
  if (!creator) return { title: "Creator not found — Shohay" };
  const name = creator.display_name ?? creator.username;
  const description = creator.bio ?? `Support ${name} on Shohay.`;
  return {
    title: `${name} — Shohay সহায়`,
    description,
    openGraph: {
      title: name,
      description,
      images: creator.cover_url
        ? [creator.cover_url]
        : creator.avatar_url
          ? [creator.avatar_url]
          : undefined,
    },
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await getCreator(username);
  if (!creator) notFound();

  const [campaigns, tiers, supporters, posts] = await Promise.all([
    getCreatorCampaigns(creator.id),
    getTiers(creator.id),
    getSupporters(creator.id),
    getPostTeasers(creator.id, 24),
  ]);

  const name = creator.display_name ?? creator.username;
  const totalRaised = campaigns.reduce(
    (sum, c) => sum + (c.raised_amount ?? 0),
    0
  );
  const target = supportTarget(campaigns);
  const joinHref = `/creator/${creator.username}/join`;

  // Profile links win; anything missing is filled from their campaign.
  const campaignLinks = campaigns.find((c) => c.social_links)?.social_links ?? {};
  const merged = { ...campaignLinks, ...(creator.social_links ?? {}) };
  const socials = SOCIAL_PLATFORMS.filter((p) => merged[p.key]).map((p) => ({
    ...p,
    url: merged[p.key],
  }));

  const joinButton =
    tiers.length > 0 ? (
      <ButtonLink href={joinHref} size="sm" className="shadow-brand">
        Join now
      </ButtonLink>
    ) : target ? (
      <ButtonLink href={`/campaigns/${target.slug}/donate`} size="sm">
        Support
      </ButtonLink>
    ) : null;

  const [featured, ...rest] = posts;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-6">
      {/* ===== Cover ===== */}
      <div className="-mx-5 overflow-hidden sm:mx-0 sm:mt-6 sm:rounded-3xl">
        <div className="aspect-[3/1] w-full sm:aspect-[4/1]">
          <SafeImage
            src={creator.cover_url}
            alt=""
            className="h-full w-full object-cover"
            fallback={
              <div className="h-full w-full bg-gradient-to-br from-brand-dark via-brand to-brand-light" />
            }
          />
        </div>
      </div>

      {/* ===== Identity ===== */}
      <div className="relative -mt-12 px-1 sm:-mt-14">
        <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-background sm:h-28 sm:w-28">
          <SafeImage
            src={creator.avatar_url}
            alt=""
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-brand-tint text-3xl font-bold text-brand-dark">
                {name.charAt(0).toUpperCase()}
              </div>
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {name}
            </h1>
            <p className="mt-1 text-sm text-muted">@{creator.username}</p>
          </div>
          {/* On a phone the button goes below the bio instead, where it
              reads as the next step rather than interrupting the name. */}
          {tiers.length > 0 ? (
            <div className="hidden shrink-0 sm:block">
              <ButtonLink href={joinHref} size="lg" className="shadow-brand">
                Become a supporter
              </ButtonLink>
            </div>
          ) : joinButton ? (
            <div className="hidden shrink-0 sm:block">{joinButton}</div>
          ) : null}
        </div>

        {creator.bio ? (
          <p className="mt-3 max-w-2xl whitespace-pre-line leading-relaxed text-body">
            {creator.bio}
          </p>
        ) : null}

        {socials.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={`${name} on ${s.label}`}
                aria-label={`${name} on ${s.label}`}
                className={`press flex h-10 w-10 items-center justify-center rounded-full text-base ${s.color}`}
              >
                {s.emoji}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {campaigns.length > 0 ? (
            <span className="rounded-full bg-brand-tint px-3 py-1 font-bold text-brand-dark">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {totalRaised > 0 ? (
            <span className="rounded-full bg-brand-tint px-3 py-1 font-bold text-brand-dark">
              {formatTaka(totalRaised)} raised
            </span>
          ) : null}
          {supporters.length > 0 ? (
            <span className="rounded-full bg-brand-tint px-3 py-1 font-bold text-brand-dark">
              {supporters.length} supporter{supporters.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {tiers.length > 0 ? (
          <div className="mt-5 sm:hidden">
            <ButtonLink href={joinHref} size="lg" full className="shadow-brand">
              Become a supporter
            </ButtonLink>
          </div>
        ) : null}
      </div>

      {/* ===== Sections ===== */}
      <div className="mt-8">
        <CreatorTabs
          action={joinButton}
          tabs={[
            {
              key: "home",
              label: "Home",
              panel: (
                <HomePanel
                  name={name}
                  featured={featured}
                  rest={rest.slice(0, 3)}
                  tiers={tiers}
                  campaigns={campaigns}
                  joinHref={joinHref}
                  target={target}
                />
              ),
            },
            posts.length > 0
              ? {
                  key: "posts",
                  label: "Posts",
                  count: posts.length,
                  panel: (
                    <div className="grid gap-5 sm:grid-cols-2">
                      {posts.map((p) => (
                        <PostCard key={p.id} post={p} joinHref={joinHref} />
                      ))}
                    </div>
                  ),
                }
              : null,
            campaigns.length > 0
              ? {
                  key: "campaigns",
                  label: "Campaigns",
                  count: campaigns.length,
                  panel: (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {campaigns.map((c) => (
                        <CampaignCard key={c.id} campaign={c} />
                      ))}
                    </div>
                  ),
                }
              : null,
            tiers.length > 0
              ? {
                  key: "membership",
                  label: "Membership",
                  panel: (
                    <MembershipPanel
                      tiers={tiers}
                      joinHref={joinHref}
                      name={name}
                    />
                  ),
                }
              : null,
            supporters.length > 0
              ? {
                  key: "supporters",
                  label: "Supporters",
                  count: supporters.length,
                  panel: <SupporterPanel supporters={supporters} />,
                }
              : null,
          ].filter(Boolean) as {
            key: string;
            label: string;
            count?: number;
            panel: React.ReactNode;
          }[]}
        />
      </div>
    </main>
  );
}

/* ---------- Panels ---------- */

function HomePanel({
  name,
  featured,
  rest,
  tiers,
  campaigns,
  joinHref,
  target,
}: {
  name: string;
  featured: PostTeaser | undefined;
  rest: PostTeaser[];
  tiers: MembershipTier[];
  campaigns: Campaign[];
  joinHref: string;
  target: Campaign | null;
}) {
  const nothingYet =
    !featured && tiers.length === 0 && campaigns.length === 0;

  if (nothingYet) {
    return (
      <EmptyState
        title={`${name} hasn't posted yet`}
        bn="এখনও কিছু পোস্ট করা হয়নি"
        hint="Check back soon, or look through other creators in the meantime."
        action={
          <ButtonLink href="/creators" variant="secondary">
            Discover other creators
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-12">
      {featured ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Latest post
          </h2>
          <div
            className={`mt-4 grid gap-5 ${
              target ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" : ""
            }`}
          >
            <PostCard post={featured} joinHref={joinHref} featured />
            {target ? (
              <CreatorSupportBox
                campaignId={target.id}
                slug={target.slug}
                creatorName={name}
              />
            ) : null}
          </div>
        </section>
      ) : target ? (
        <section className="max-w-md">
          <CreatorSupportBox
            campaignId={target.id}
            slug={target.slug}
            creatorName={name}
          />
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Recent posts
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {rest.map((p) => (
              <PostCard key={p.id} post={p} joinHref={joinHref} />
            ))}
          </div>
        </section>
      ) : null}

      {tiers.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Membership
          </h2>
          <div className="mt-4">
            <MembershipPanel tiers={tiers} joinHref={joinHref} name={name} />
          </div>
        </section>
      ) : null}

      {campaigns.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Campaigns
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {campaigns.slice(0, 2).map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MembershipPanel({
  tiers,
  joinHref,
  name,
}: {
  tiers: MembershipTier[];
  joinHref: string;
  name: string;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Link
            key={tier.id}
            href={`${joinHref}?tier=${tier.id}`}
            className="lift flex flex-col rounded-2xl bg-card p-6 shadow-soft no-underline"
          >
            <span className="text-lg font-bold">{tier.name}</span>
            {tier.name_bn ? (
              <span className="font-bengali mt-0.5 text-sm text-muted">
                {tier.name_bn}
              </span>
            ) : null}
            <span className="mt-3 text-2xl font-extrabold text-brand">
              {formatTaka(Number(tier.amount))}
              <span className="text-sm font-semibold text-muted"> /month</span>
            </span>
            {tier.perks ? (
              <span className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-body">
                {tier.perks}
              </span>
            ) : null}
            <span className="press mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white">
              Join
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Monthly support is what lets {name} plan ahead. You can stop any time.
      </p>
    </>
  );
}

function SupporterPanel({ supporters }: { supporters: PublicSupporter[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {supporters.map((s, i) => (
        <li
          key={`${s.supporter_name}-${s.started_at}-${i}`}
          className="rounded-2xl bg-card p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint font-bold text-brand-dark">
              {s.supporter_name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-bold">
                {s.supporter_name}
              </span>
              {s.tier_name ? (
                <span className="block text-xs font-bold text-brand">
                  {s.tier_name}
                </span>
              ) : null}
            </span>
          </div>
          {s.message ? (
            <p className="mt-3 text-sm italic leading-relaxed text-body">
              “{s.message}”
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
