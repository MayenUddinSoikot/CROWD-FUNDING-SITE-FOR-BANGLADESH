import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, PublicCreator } from "@/lib/types";
import { SOCIAL_PLATFORMS } from "@/lib/types";
import { formatTaka } from "@/lib/format";
import { CampaignCard } from "@/components/CampaignCard";
import { CreatorSupportBox } from "@/components/CreatorSupportBox";
import { PostMedia } from "@/components/PostMedia";
import { getTiers, getSupporters, getPublicPosts } from "@/lib/memberships";

// Always show the creator's live campaigns and totals.
export const dynamic = "force-dynamic";

const CREATOR_FIELDS = "id, username, display_name, bio, avatar_url";

async function getCreator(username: string): Promise<PublicCreator | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    // social_links exists only after creator-page.sql — fall back.
    const first = await supabase
      .from("public_creators")
      .select(`${CREATOR_FIELDS}, social_links`)
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

    // social_links / campaign_no exist only after their SQL scripts.
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
  return {
    title: `${name} — Shohay সহায়`,
    description: creator.bio ?? `Support ${name} on Shohay.`,
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
    getPublicPosts(creator.id, 6),
  ]);
  const name = creator.display_name ?? creator.username;
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount ?? 0), 0);
  const target = supportTarget(campaigns);

  // Profile links win; anything missing is filled from their campaign.
  const campaignLinks = campaigns.find((c) => c.social_links)?.social_links ?? {};
  const merged = { ...campaignLinks, ...(creator.social_links ?? {}) };
  const socials = SOCIAL_PLATFORMS.filter((p) => merged[p.key]).map((p) => ({
    ...p,
    url: merged[p.key],
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      {/* Banner */}
      <div className="mt-6 h-32 w-full rounded-3xl bg-gradient-to-r from-brand/25 via-brand/10 to-accent/15 sm:h-40" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        {/* ===== Left: identity, about, campaigns ===== */}
        <div>
          <div className="-mt-12 flex flex-col items-start gap-3 px-1 sm:-mt-14">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatar_url}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-4 ring-background sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand/15 text-3xl font-bold text-brand ring-4 ring-background sm:h-28 sm:w-28">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="font-serif text-3xl font-bold leading-tight">
                {name}
              </h1>
              <p className="mt-0.5 text-sm opacity-50">@{creator.username}</p>
            </div>

            {socials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    title={`${name} on ${s.label}`}
                    className="flex items-center gap-2 rounded-full border border-foreground/15 py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${s.color}`}
                    >
                      {s.emoji}
                    </span>
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
              </span>
              {totalRaised > 0 ? (
                <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
                  {formatTaka(totalRaised)} raised
                </span>
              ) : null}
            </div>
          </div>

          {/* About */}
          <section className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
            <h2 className="text-sm font-bold text-brand">
              About {name} · <span className="font-bengali">পরিচিতি</span>
            </h2>
            {creator.bio ? (
              <p className="mt-3 whitespace-pre-line leading-relaxed opacity-85">
                {creator.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm opacity-60">
                This creator hasn&rsquo;t written a bio yet.
              </p>
            )}
          </section>

          {/* Monthly membership */}
          {tiers.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold">
                Support {name} monthly ·{" "}
                <span className="font-bengali">মাসিক সহায়</span>
              </h2>
              <p className="mt-1 text-sm text-muted">
                Steady support is what lets a creator plan ahead.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <Link
                    key={tier.id}
                    href={`/creator/${creator.username}/join?tier=${tier.id}`}
                    className="lift block rounded-2xl bg-card p-5 shadow-soft no-underline"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">{tier.name}</span>
                      <span className="shrink-0 font-extrabold text-brand">
                        {formatTaka(Number(tier.amount))}
                        <span className="text-xs font-semibold text-muted">
                          /mo
                        </span>
                      </span>
                    </span>
                    {tier.name_bn ? (
                      <span className="font-bengali mt-0.5 block text-sm text-muted">
                        {tier.name_bn}
                      </span>
                    ) : null}
                    {tier.perks ? (
                      <span className="mt-2 block whitespace-pre-line text-sm leading-relaxed text-body">
                        {tier.perks}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Posts */}
          {posts.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold">
                Updates · <span className="font-bengali">আপডেট</span>
              </h2>
              <ul className="mt-4 space-y-4">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="overflow-hidden rounded-2xl bg-card shadow-soft"
                  >
                    <PostMedia
                      imageUrl={post.image_url}
                      videoUrl={post.video_url}
                      alt={post.title}
                    />
                    <div className="p-5">
                      <p className="text-xs text-muted">
                        {new Date(post.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 text-lg font-bold">{post.title}</p>
                      {post.body ? (
                        <p className="mt-2 whitespace-pre-line leading-relaxed text-body">
                          {post.body}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Supporter wall */}
          {supporters.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold">
                Supporters · <span className="font-bengali">সমর্থকরা</span>
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {supporters.map((s, i) => (
                  <li
                    key={`${s.supporter_name}-${s.started_at}-${i}`}
                    title={s.message ?? undefined}
                    className="rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-soft"
                  >
                    {s.supporter_name}
                    {s.tier_name ? (
                      <span className="ml-2 text-xs font-bold text-brand">
                        {s.tier_name}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Campaigns */}
          <section className="mt-8">
            <h2 className="text-xl font-bold">
              Campaigns · <span className="font-bengali">ক্যাম্পেইন</span>
            </h2>

            {campaigns.length === 0 ? (
              <p className="mt-4 text-sm opacity-60">
                No live campaigns yet.{" "}
                <span className="font-bengali">এখনো কোনো ক্যাম্পেইন নেই।</span>
              </p>
            ) : (
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ===== Right: support box ===== */}
        <aside className="lg:pt-6">
          <div className="lg:sticky lg:top-24">
            {target ? (
              <>
                <CreatorSupportBox
                  campaignId={target.id}
                  slug={target.slug}
                  creatorName={name}
                />
                {tiers.length > 0 ? (
                  <Link
                    href={`/creator/${creator.username}/join`}
                    className="press mt-3 flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-brand/30 bg-card px-5 text-base font-bold text-brand no-underline hover:border-brand"
                  >
                    Support monthly from{" "}
                    {formatTaka(
                      Math.min(...tiers.map((t) => Number(t.amount)))
                    )}
                  </Link>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-foreground/10 bg-card p-6 text-center">
                <p className="text-3xl">☕</p>
                <p className="mt-2 font-semibold">
                  {name} isn&rsquo;t taking support right now
                </p>
                <p className="mt-1 text-sm opacity-60">
                  They have no live page yet. Check back soon.
                </p>
                <Link
                  href="/creators"
                  className="mt-4 inline-block rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
                >
                  Discover other creators →
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
