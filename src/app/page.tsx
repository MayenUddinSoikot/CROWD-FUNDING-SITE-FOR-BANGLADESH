import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, CampaignCategory, SiteMedia } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatTaka, percentRaised, formatCampaignId } from "@/lib/format";
import { RealtimeCampaignGrid } from "@/components/RealtimeCampaignGrid";
import { MediaFrame } from "@/components/MediaTile";
import { ButtonLink, Card, EmptyState, ProgressBar, SectionHeading } from "@/components/ui";
import { CreatorCard } from "@/components/CreatorCard";
import { CoverImage } from "@/components/CoverImage";
import { getCreators } from "@/lib/creators";

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

const CAMPAIGN_FIELDS =
  "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, district, is_recurring, cycle_days, cycle_anchor, ends_at, created_at";

async function getCampaigns(
  category: CampaignCategory | null
): Promise<Campaign[] | null> {
  if (!isSupabaseConfigured()) return null;

  // Never crash the page on a bad connection — fall back to the
  // "database not connected" notice instead.
  try {
    const supabase = getSupabaseClient();
    const run = (fields: string) => {
      let q = supabase
        .from("campaigns")
        .select(fields)
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      return q;
    };

    // campaign_no exists only after campaign-ids.sql — fall back safely.
    let { data, error } = await run(`${CAMPAIGN_FIELDS}, campaign_no`);
    if (error) ({ data, error } = await run(CAMPAIGN_FIELDS));
    if (error) {
      console.error("Failed to load campaigns:", error.message);
      return null;
    }
    return data as unknown as Campaign[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return null;
  }
}

// Photos and videos Shohay placed itself. Empty until an admin adds
// some, and silently empty if site-media.sql hasn't been run.
async function getSiteMedia(): Promise<SiteMedia[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_media")
      .select("id, slot, media_type, url, title, subtitle, link_url, position, published")
      .eq("published", true)
      .order("position", { ascending: true });
    if (error) return [];
    return (data ?? []) as SiteMedia[];
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && category in CATEGORY_LABELS
      ? (category as CampaignCategory)
      : null;

  const [campaigns, siteMedia, creators] = await Promise.all([
    getCampaigns(activeCategory),
    getSiteMedia(),
    getCreators(8),
  ]);

  const hero = siteMedia.find((m) => m.slot === "hero") ?? null;
  const featured = siteMedia.filter((m) => m.slot === "featured");

  // The campaign shown in the hero card when no hero media is set.
  const spotlight =
    campaigns?.find((c) => c.status === "approved" && c.cover_image_url) ??
    campaigns?.[0] ??
    null;

  const chip =
    "press shrink-0 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap min-h-[44px] inline-flex items-center";
  const chipOn = "border-brand bg-brand text-white";
  const chipOff = "border-foreground/15 bg-card hover:border-brand hover:text-brand";

  return (
    <main className="flex-1 pb-20">
      {/* ===== Hero ===== */}
      <section className="w-full bg-gradient-to-b from-brand-tint/70 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-4 py-2 text-xs font-bold text-brand-dark sm:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                0% platform fee — always
              </span>

              <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
                The people who
                <br className="hidden sm:block" /> follow you can
                <br className="hidden sm:block" />{" "}
                <span className="text-brand">change a life.</span>
              </h1>
              <p className="font-bengali mt-4 text-2xl font-semibold text-brand-dark sm:text-3xl">
                আপনার সঙ্গে যাঁরা আছেন, তাঁরাই পারেন
              </p>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">
                Build a page, bring your audience, and raise for the people who
                need it. Shohay takes <b className="text-foreground">0%</b> —
                every taka reaches the person you sent it to.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/setup" size="lg">
                  Create your page
                </ButtonLink>
                <ButtonLink href="#campaigns" variant="secondary" size="lg">
                  Browse campaigns
                </ButtonLink>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {[
                  "Every campaign verified",
                  "0% platform fee",
                  "Paid straight to bKash or bank",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm font-semibold text-body"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero media — Shohay's own photo/video, else a live campaign */}
            <div>
              {hero ? (
                <figure className="m-0 overflow-hidden rounded-3xl shadow-lift">
                  <div className="aspect-[4/3] w-full bg-brand-tint">
                    <MediaFrame item={hero} />
                  </div>
                  {hero.title || hero.subtitle ? (
                    <figcaption className="bg-card px-6 py-5">
                      {hero.title ? (
                        <p className="text-lg font-bold">{hero.title}</p>
                      ) : null}
                      {hero.subtitle ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {hero.subtitle}
                        </p>
                      ) : null}
                      {hero.link_url ? (
                        <Link
                          href={hero.link_url}
                          className="press mt-3 inline-flex min-h-[44px] items-center text-sm font-bold text-brand hover:text-brand-dark"
                        >
                          Read the story →
                        </Link>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              ) : spotlight ? (
                <Card className="overflow-hidden shadow-lift">
                  <div className="relative aspect-[4/3] w-full bg-brand-tint">
                    <CoverImage
                      src={spotlight.cover_image_url}
                      emoji={
                        (
                          CATEGORY_LABELS[spotlight.category] ??
                          CATEGORY_LABELS.other
                        ).emoji
                      }
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-dark">
                      {(CATEGORY_LABELS[spotlight.category] ?? CATEGORY_LABELS.other).en}
                    </span>
                    {formatCampaignId(spotlight.campaign_no) ? (
                      <span className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                        {formatCampaignId(spotlight.campaign_no)}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-6">
                    <h2 className="text-xl font-bold leading-snug">
                      {spotlight.title}
                    </h2>
                    {spotlight.title_bn ? (
                      <p className="font-bengali mt-1.5 text-sm text-muted">
                        {spotlight.title_bn}
                      </p>
                    ) : null}

                    <div className="mt-5">
                      <ProgressBar
                        percent={percentRaised(
                          spotlight.raised_amount,
                          spotlight.goal_amount
                        )}
                      />
                      <div className="mt-3 flex items-baseline justify-between gap-3">
                        <span className="text-2xl font-extrabold tracking-tight">
                          {formatTaka(spotlight.raised_amount)}
                        </span>
                        <span className="text-sm text-muted">
                          of {formatTaka(spotlight.goal_amount)}
                        </span>
                      </div>
                    </div>

                    <ButtonLink
                      href={`/campaigns/${spotlight.slug}`}
                      full
                      className="mt-5 !rounded-2xl"
                    >
                      Donate now
                    </ButtonLink>
                  </div>
                </Card>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-brand-tint to-brand/10 text-6xl shadow-soft">
                  🇧🇩
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Campaigns ===== */}
      {/* ===== Creators ===== */}
      {/* Faces before listings. A creator platform that opens on a grid
          of causes reads as a charity directory; opening on the people
          doing the raising is what makes Patreon feel like Patreon. */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-6">
        <SectionHeading
          title="Creators raising for Bangladesh"
          bn="যাঁরা সাহায্য তুলছেন"
        >
          {creators.length > 0 ? (
            <ButtonLink href="/creators" variant="secondary" size="sm">
              See all creators
            </ButtonLink>
          ) : null}
        </SectionHeading>

        {creators.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Be the first creator on Shohay"
              bn="প্রথম ক্রিয়েটর হোন"
              hint="Build a page, bring the people who already follow you, and raise for someone who needs it."
              action={<ButtonLink href="/setup">Create your page</ButtonLink>}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {creators.slice(0, 4).map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </section>

      <section id="campaigns" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-6 sm:px-6">
        <SectionHeading title="Needs help right now" bn="এখনই সাহায্য দরকার">
          <Link
            href="/campaigns"
            className="press inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark"
          >
            See all campaigns
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </SectionHeading>

        {/* Category chips — scroll sideways on a phone */}
        <div className="scroll-x -mx-5 mt-6 flex gap-2.5 px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link
            href="/#campaigns"
            className={`${chip} ${activeCategory === null ? chipOn : chipOff}`}
          >
            All causes
          </Link>
          {(
            Object.entries(CATEGORY_LABELS) as [
              CampaignCategory,
              (typeof CATEGORY_LABELS)[CampaignCategory],
            ][]
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/?category=${key}#campaigns`}
              className={`${chip} ${activeCategory === key ? chipOn : chipOff}`}
            >
              {label.emoji} {label.en}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          {campaigns === null ? (
            <EmptyState
              title="The database isn't connected yet"
              hint="Add the Supabase environment variables in Vercel and redeploy."
            />
          ) : campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns in this category yet"
              bn="এই ক্যাটাগরিতে এখনো কোনো ক্যাম্পেইন নেই"
              action={
                <ButtonLink href="/#campaigns" variant="secondary">
                  See all causes
                </ButtonLink>
              }
            />
          ) : (
            <RealtimeCampaignGrid
              key={activeCategory ?? "all"}
              initialCampaigns={campaigns}
              activeCategory={activeCategory}
            />
          )}
        </div>
      </section>

      {/* ===== Stories from Shohay — your own photos and videos ===== */}
      {featured.length > 0 ? (
        <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-6">
          <SectionHeading title="Stories from Shohay" bn="সহায়ের গল্প" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => {
              const body = (
                <Card hover className="h-full overflow-hidden">
                  <div className="aspect-video w-full bg-brand-tint">
                    <MediaFrame item={item} />
                  </div>
                  {item.title || item.subtitle ? (
                    <div className="p-5">
                      {item.title ? (
                        <h3 className="text-base font-bold leading-snug">
                          {item.title}
                        </h3>
                      ) : null}
                      {item.subtitle ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              );

              // A video needs its own controls, so only still images link out.
              return item.link_url && item.media_type === "image" ? (
                <Link key={item.id} href={item.link_url} className="block">
                  {body}
                </Link>
              ) : (
                <div key={item.id}>{body}</div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ===== Trust band ===== */}
      <section className="mt-20 w-full bg-gradient-to-br from-brand to-brand-dark px-5 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Bangladesh&rsquo;s trusted place to give
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/85">
            Every campaign is checked with a government ID and documents before
            it goes live. 0% platform fee, secure bKash, Nagad and card
            payments, and an independent audit every year.
          </p>

          <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[
              { big: "0%", small: "platform fee" },
              { big: "100%", small: "verified campaigns" },
              { big: "3 days", small: "to payout" },
            ].map((s) => (
              <div key={s.small}>
                <p className="text-2xl font-extrabold sm:text-3xl">{s.big}</p>
                <p className="mt-1 text-xs text-white/75 sm:text-sm">{s.small}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href="/start"
              size="lg"
              className="!bg-white !text-brand-dark !shadow-none hover:!bg-white/90"
            >
              Start a campaign
            </ButtonLink>
            <ButtonLink
              href="/about"
              size="lg"
              className="!border-white/40 !bg-transparent !text-white hover:!bg-white/10"
              variant="secondary"
            >
              How it works
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="mx-auto mt-20 max-w-6xl scroll-mt-24 px-5 sm:px-6">
        <SectionHeading title="How Shohay works" bn="সহায় যেভাবে কাজ করে" />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "1",
              en: "Tell your story",
              bn: "আপনার কথা বলুন",
              desc: "Add photos, a video, a goal and your documents. It takes about ten minutes.",
            },
            {
              n: "2",
              en: "We verify it",
              bn: "আমরা যাচাই করি",
              desc: "Our team checks every ID and document privately before your page goes live.",
            },
            {
              n: "3",
              en: "Get paid out",
              bn: "টাকা পান",
              desc: "Funds reach your bKash or bank three days after your campaign ends.",
            },
          ].map((item) => (
            <Card key={item.n} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-lg font-extrabold text-brand-dark">
                {item.n}
              </div>
              <h3 className="mt-4 text-lg font-bold">{item.en}</h3>
              <p className="font-bengali mt-1 text-sm font-semibold text-brand">
                {item.bn}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-body">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== Closing call to action =====
          Patreon ends every scroll on the same ask, and the page used to
          finish on "How it works" — a reader who went all the way down
          had nowhere to go. */}
      <section className="mt-20 w-full bg-brand-tint px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight text-brand-dark sm:text-5xl">
            Your page takes ten minutes.
          </h2>
          <p className="font-bengali mt-3 text-lg font-semibold text-brand">
            আপনার পেজ বানাতে দশ মিনিট লাগে
          </p>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-body">
            Free to start, 0% from Shohay, and our team checks every campaign
            before it goes live. The people who already follow you are the
            ones who give first.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/setup" size="lg">
              Create your page
            </ButtonLink>
            <ButtonLink href="/campaigns" size="lg" variant="secondary">
              See who needs help
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
