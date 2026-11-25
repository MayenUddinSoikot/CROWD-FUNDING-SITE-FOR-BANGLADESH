import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, CampaignCategory, SiteMedia } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { MediaFrame } from "@/components/MediaTile";
import { ButtonLink, Card, EmptyState, SectionHeading } from "@/components/ui";
import { CreatorCard } from "@/components/CreatorCard";
import { SafeImage } from "@/components/SafeImage";
import { DashboardPreview } from "@/components/DashboardPreview";
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

  /* The campaign shown in the hero card when no hero media is set.

     Pick the one with the most money behind it. The old rule took the
     first approved campaign that had a cover_image_url, which handed
     the top of the homepage to a placeholder sitting at ৳0 — and one
     whose "photo" was a broken link at that. A page that leads with a
     campaign strangers have already backed is the one that argues for
     itself; we cannot tell a good photo from a bad one on the server,
     but we can tell which story is working. */
  const approved = (campaigns ?? []).filter((c) => c.status === "approved");
  const spotlight =
    [...approved].sort(
      (a, b) => Number(b.raised_amount ?? 0) - Number(a.raised_amount ?? 0)
    )[0] ??
    campaigns?.[0] ??
    null;

  return (
    <main className="flex-1 pb-20">
      {/* ===== Hero =====
          Patreon's hero is one photograph filling the screen with the
          headline over it and a credit line for whoever is in the shot.
          Ours is built the same way: the image is the background, not a
          card beside the text. Until a photo is set in /admin/homepage it
          falls back to a deep field of brand colour, which still reads as
          a hero rather than as a broken image. */}
      <section className="relative w-full overflow-hidden bg-[#0b1a14] text-white">
        {hero?.media_type === "image" && hero.url ? (
          <SafeImage
            src={hero.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallback={null}
          />
        ) : spotlight?.cover_image_url ? (
          <SafeImage
            src={spotlight.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallback={null}
          />
        ) : null}

        {/* Dark wash so the type stays readable over any photograph */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1a14] via-[#0b1a14]/85 to-[#11694a]/70" />

        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-xs font-bold sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#35c08a]" />
            0% platform fee — always
          </span>

          <h1 className="mt-6 max-w-4xl text-[2.9rem] font-normal leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            The people who follow you can change a life.
          </h1>
          <p className="font-bengali mt-5 max-w-2xl text-xl font-semibold text-white/85 sm:text-2xl">
            আপনার সঙ্গে যাঁরা আছেন, তাঁরাই পারেন
          </p>

          <p className="mt-5 max-w-xl leading-relaxed text-white/75">
            Build a page, bring your audience, and raise for the people who
            need it. Shohay takes 0% — every taka reaches the person you
            sent it to.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/setup"
              className="press inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-lg font-bold text-[#0b1a14] no-underline"
            >
              Create your page
            </Link>
            <Link
              href="/creators"
              className="press inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-8 text-lg font-bold text-white no-underline hover:bg-white/10"
            >
              Find a creator
            </Link>
          </div>

          <form action="/campaigns" className="mt-7 max-w-lg">
            <label htmlFor="hero-search" className="sr-only">
              Find a creator or a campaign
            </label>
            <div className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 focus-within:border-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="shrink-0 text-white/60"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Find a creator or a campaign"
                className="w-full bg-transparent py-1.5 text-white outline-none placeholder:text-white/50"
              />
              <button
                type="submit"
                className="press min-h-[40px] shrink-0 rounded-full bg-white px-5 text-sm font-bold text-[#0b1a14]"
              >
                Search
              </button>
            </div>
          </form>

          {/* The credit line Patreon runs under its hero photograph */}
          {spotlight ? (
            <Link
              href={`/campaigns/${spotlight.slug}`}
              className="press mt-10 flex w-fit items-center gap-2 text-sm font-semibold text-white/80 no-underline hover:text-white"
            >
              Raising now: {spotlight.title}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      </section>

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

      {/* ===== More ways to raise =====
          Patreon's "More ways to earn": the argument that the platform
          is not one fundraiser but a living income. Ours is the same
          argument in taka. */}
      <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-6">
        <h2 className="max-w-3xl text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          More ways to raise
        </h2>
        <p className="font-bengali mt-3 text-xl font-semibold text-brand-dark">
          সাহায্য তোলার আরও উপায়
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">
          A campaign ends. Your page does not. On Shohay you can run a
          one-off appeal, take monthly support from the people who follow
          you, and let friends raise for you on their birthday — all from
          the same page.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "৳",
              en: "One-off campaigns",
              bn: "একক ক্যাম্পেইন",
              desc: "A goal, a deadline and a story. Verified by our team before anyone can give.",
            },
            {
              icon: "♡",
              en: "Monthly supporters",
              bn: "মাসিক সমর্থক",
              desc: "Tiers from ৳100. Steady money you can plan around instead of starting from zero.",
            },
            {
              icon: "🎂",
              en: "Occasion fundraisers",
              bn: "বিশেষ দিনের আবেদন",
              desc: "Ask for donations instead of presents. Your friends give, you choose who it reaches.",
            },
          ].map((way) => (
            <Card key={way.en} className="p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-xl font-extrabold text-brand-dark">
                {way.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold">{way.en}</h3>
              <p className="font-bengali mt-1 text-sm font-semibold text-brand">
                {way.bn}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-body">
                {way.desc}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <ButtonLink href="/setup" size="lg">
            Set up your page
          </ButtonLink>
        </div>
      </section>

      {/* ===== See what is working =====
          Patreon's "Unlock growth", which sells the back office with a
          picture of it. We built that dashboard, so show it. */}
      <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_380px] lg:gap-16">
          <div>
            <h2 className="text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              See what is working
            </h2>
            <p className="font-bengali mt-3 text-xl font-semibold text-brand-dark">
              কোনটা কাজ করছে দেখুন
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
              Your dashboard shows who opened your campaign, how many of
              them gave, what your supporters pledge each month, and what
              lands in your bKash after the bank&rsquo;s charge. Share a
              link and watch what it brings back.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Views, donors and the share who gave after viewing",
                "Monthly pledges, separately from one-off gifts",
                "What you raised for other people's campaigns",
              ].map((line) => (
                <li key={line} className="flex gap-3 text-body">
                  <span aria-hidden="true" className="font-bold text-brand">
                    ✓
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <ButtonLink href="/account" variant="secondary" size="lg">
                Open your dashboard
              </ButtonLink>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[340px]">
            <DashboardPreview />
          </div>
        </div>
      </section>

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
