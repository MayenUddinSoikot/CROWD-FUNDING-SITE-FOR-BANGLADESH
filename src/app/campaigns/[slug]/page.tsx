import { CREATOR_FEE_PCT } from "@/lib/fees";
import type { Metadata } from "next";
import { SocialIcon } from "@/components/SocialIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignMedia,
  CampaignUpdate,
  PublicCreator,
  PublicDonation,
} from "@/lib/types";
import {
  CATEGORY_LABELS,
  RELATIONSHIP_LABELS,
  OCCASION_LABELS,
  SOCIAL_PLATFORMS,
  youtubeEmbedUrl,
} from "@/lib/types";
import { formatTaka, timeAgo, formatCampaignId } from "@/lib/format";
import { RealtimeCampaignStats } from "@/components/RealtimeCampaignStats";
import { ShareButtons } from "@/components/ShareButtons";
import { TrackView } from "@/components/TrackView";
import { MediaCarousel } from "@/components/MediaCarousel";
import { CampaignUpdateForm } from "@/components/CampaignUpdateForm";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { SafeImage } from "@/components/SafeImage";

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// Days left in the current 30-day cycle for a recurring creator page.
function cycleDaysLeft(anchor: string | null, cycleDays: number): number | null {
  if (!anchor) return null;
  const a = new Date(anchor).getTime();
  if (Number.isNaN(a)) return null;
  const cyc = cycleDays * 24 * 60 * 60 * 1000;
  const passed = Math.floor((Date.now() - a) / cyc);
  const end = a + (passed + 1) * cyc;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

function initialOf(name: string | null | undefined): string {
  const c = (name ?? "").trim().charAt(0);
  return c ? c.toUpperCase() : "S";
}

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

const CAMPAIGN_FIELDS =
  "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, video_url, beneficiary_name, organizer_name, organizer_relationship, campaign_type, occasion, is_recurring, cycle_days, cycle_anchor, district, ends_at, created_at, creator_id";

async function getCampaign(slug: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from("campaigns")
      .select(`${CAMPAIGN_FIELDS}, social_links, campaign_no`)
      .eq("slug", slug)
      .in("status", ["approved", "completed"])
      .maybeSingle();

    // social_links / campaign_no exist only after their SQL scripts have
    // run — fall back to the base fields so campaigns never 404.
    if (error) {
      ({ data, error } = await supabase
        .from("campaigns")
        .select(CAMPAIGN_FIELDS)
        .eq("slug", slug)
        .in("status", ["approved", "completed"])
        .maybeSingle());
    }

    if (error) {
      console.error("Failed to load campaign:", error.message);
      return null;
    }
    return data as Campaign | null;
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return null;
  }
}

async function getDonations(campaignId: string): Promise<PublicDonation[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("public_donations")
      .select("id, campaign_id, donor_name, amount, message, paid_at")
      .eq("campaign_id", campaignId)
      .order("paid_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Failed to load donations:", error.message);
      return [];
    }
    return data as PublicDonation[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return [];
  }
}

async function getMedia(campaignId: string): Promise<CampaignMedia[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("campaign_media")
      .select("id, campaign_id, media_type, url, position")
      .eq("campaign_id", campaignId)
      .order("position", { ascending: true });
    if (error) {
      console.error("Failed to load media:", error.message);
      return [];
    }
    return data as CampaignMedia[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return [];
  }
}

async function getCharityAllocations(
  campaignId: string
): Promise<{ name: string; percentage: number }[]> {
  try {
    const supabase = getSupabaseClient();
    const { data: allocs } = await supabase
      .from("campaign_charities")
      .select("charity_id, percentage")
      .eq("campaign_id", campaignId);
    if (!allocs || allocs.length === 0) return [];

    const ids = allocs.map((a) => a.charity_id);
    const { data: charities } = await supabase
      .from("public_charities")
      .select("id, name")
      .in("id", ids);
    const nameById = new Map(
      (charities ?? []).map((c) => [c.id as string, c.name as string])
    );
    return allocs.map((a) => ({
      name: nameById.get(a.charity_id) ?? "Charity",
      percentage: Number(a.percentage),
    }));
  } catch {
    return [];
  }
}

async function getCreator(creatorId: string): Promise<PublicCreator | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("public_creators")
      .select("id, username, display_name, bio, avatar_url")
      .eq("id", creatorId)
      .maybeSingle();
    if (error) {
      console.error("Failed to load creator:", error.message);
      return null;
    }
    return data as PublicCreator | null;
  } catch {
    return null;
  }
}

async function getUpdates(campaignId: string): Promise<CampaignUpdate[]> {
  try {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from("campaign_updates")
      .select("id, campaign_id, body, image_url, video_url, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Media columns exist only after campaigner-tools.sql — fall back.
    if (error) {
      const retry = await supabase
        .from("campaign_updates")
        .select("id, campaign_id, body, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(50);
      data = (retry.data ?? []) as unknown as typeof data;
      error = retry.error;
    }

    if (error) {
      console.error("Failed to load updates:", error.message);
      return [];
    }
    return data as CampaignUpdate[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return { title: "Campaign not found — Shohay" };

  const title = `${campaign.title} — Shohay সহায়`;
  const description =
    campaign.summary ??
    `Help ${campaign.beneficiary_name ?? "this campaign"} on Shohay.`;

  // A real photo and title in the share preview is what makes a campaign
  // spread on Facebook and WhatsApp.
  return {
    title,
    description,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/campaigns/${campaign.slug}`,
      images: campaign.cover_image_url
        ? [{ url: campaign.cover_image_url }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: campaign.cover_image_url ? [campaign.cover_image_url] : undefined,
    },
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  // These don't depend on each other, so fetch them together — one round
  // trip to Supabase instead of five, which is most of this page's wait.
  const [donations, updates, media, charityAllocations, creator] =
    await Promise.all([
      getDonations(campaign.id),
      getUpdates(campaign.id),
      getMedia(campaign.id),
      getCharityAllocations(campaign.id),
      campaign.creator_id ? getCreator(campaign.creator_id) : null,
    ]);
  const category = CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
  const remaining = daysLeft(campaign.ends_at);
  const cycleLeft = campaign.is_recurring
    ? cycleDaysLeft(campaign.cycle_anchor, campaign.cycle_days)
    : null;
  const supportMessages = donations.filter((d) => d.message);
  const socialLinks = SOCIAL_PLATFORMS.filter(
    (p) => campaign.social_links?.[p.key]
  ).map((p) => ({ ...p, url: campaign.social_links![p.key] }));

  // Can the current viewer post updates? (the creator, or an admin)
  // Their username comes back too, so the share kit can hand them a link
  // that credits them for whatever it brings in.
  let canPostUpdate = false;
  let viewerUsername: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const [{ data: owned }, { data: profile }] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id")
          .eq("id", campaign.id)
          .eq("creator_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_admin, username")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      canPostUpdate = Boolean(owned) || Boolean(profile?.is_admin);
      viewerUsername = (profile?.username as string | null) ?? null;
    }
  }

  const urgent =
    !campaign.is_recurring && remaining !== null && remaining >= 0 && remaining <= 7;

  const donateButton = (
    <ButtonLink
      href={`/campaigns/${campaign.slug}/donate`}
      size="lg"
      full
      className="!rounded-2xl"
    >
      {campaign.campaign_type === "creator" ? (
        <>Buy a cha ☕ · <span className="font-bengali">চা খাওয়ান</span></>
      ) : (
        <>Donate now · <span className="font-bengali">দান করুন</span></>
      )}
    </ButtonLink>
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 sm:px-6">
      <TrackView campaignId={campaign.id} />

      {/* Badges above the title set the context before you read a word */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {urgent ? <StatusBadge tone="urgent">Urgent</StatusBadge> : null}
        {campaign.campaign_type === "creator" ? (
          <StatusBadge tone="live">☕ Creator support</StatusBadge>
        ) : null}
        {campaign.occasion && OCCASION_LABELS[campaign.occasion] ? (
          <StatusBadge tone="urgent">
            {OCCASION_LABELS[campaign.occasion].emoji}{" "}
            {OCCASION_LABELS[campaign.occasion].label} fundraiser
          </StatusBadge>
        ) : null}
        <StatusBadge tone="live">
          {category.en} · <span className="font-bengali">{category.bn}</span>
        </StatusBadge>
        {campaign.district ? (
          <span className="text-sm font-semibold text-muted">
            {campaign.district}
          </span>
        ) : null}
        {formatCampaignId(campaign.campaign_no) ? (
          <span className="text-sm font-semibold text-muted">
            · ID {formatCampaignId(campaign.campaign_no)}
          </span>
        ) : null}
      </div>

      <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-5xl">
        {campaign.title}
      </h1>
      {campaign.title_bn ? (
        <p className="font-bengali mt-2.5 max-w-3xl text-xl text-muted sm:text-2xl">
          {campaign.title_bn}
        </p>
      ) : null}

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        {/* ===== Left column, part 1: media + organizer line ===== */}
        <div className="lg:col-start-1">
          <MediaCarousel media={media} fallbackEmoji={category.emoji} />

          {campaign.organizer_name || campaign.beneficiary_name ? (
            <div className="mt-6 flex items-center gap-3 border-b border-foreground/10 pb-6 text-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint font-bold text-brand-dark">
                {initialOf(campaign.organizer_name ?? campaign.beneficiary_name)}
              </span>
              <p>
                {campaign.organizer_name ? (
                  <>
                    <span className="font-semibold">{campaign.organizer_name}</span>
                    {campaign.beneficiary_name ? (
                      <>
                        <span className="opacity-60"> is organizing this fundraiser for </span>
                        <span className="font-semibold">{campaign.beneficiary_name}</span>
                      </>
                    ) : (
                      <span className="opacity-60"> is organizing this fundraiser</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="opacity-60">Fundraiser for </span>
                    <span className="font-semibold">{campaign.beneficiary_name}</span>
                  </>
                )}
              </p>
            </div>
          ) : null}
        </div>

        {/* ===== Right column: sticky money card (GoFundMe style) ===== */}
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-2xl bg-card p-6 shadow-lift lg:sticky lg:top-24">
            {campaign.is_recurring ? (
              <p className="mb-3 text-sm font-medium text-brand">
                ☕ Monthly support · resets every 30 days
                {cycleLeft !== null ? (
                  <span className="opacity-70">
                    {" "}
                    · {cycleLeft} day{cycleLeft === 1 ? "" : "s"} left this cycle
                  </span>
                ) : null}
              </p>
            ) : remaining !== null ? (
              <p className="mb-3 text-sm font-medium">
                {remaining > 0 ? (
                  <>
                    ⏳ {remaining} day{remaining === 1 ? "" : "s"} left ·{" "}
                    <span className="font-bengali">{remaining} দিন বাকি</span>
                  </>
                ) : (
                  <span className="opacity-60">This campaign has ended.</span>
                )}
              </p>
            ) : null}

            <RealtimeCampaignStats
              key={campaign.id}
              campaignId={campaign.id}
              initialRaised={campaign.raised_amount}
              goalAmount={campaign.goal_amount}
              donationCount={donations.length}
              monthly={campaign.is_recurring}
            />

            <div className="mt-6">{donateButton}</div>

            <div className="mt-3">
              <ShareButtons
                title={campaign.title}
                slug={campaign.slug}
                via={viewerUsername}
              />
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              {campaign.campaign_type === "creator"
                ? `Creator page · Shohay keeps ${CREATOR_FEE_PCT}%, plus bank charges`
                : "Shohay takes 0% — only bank charges apply"}
            </p>

            {donations.length > 0 ? (
              <div className="mt-6 border-t border-foreground/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Recent donations
                </p>
                <ul className="mt-3 space-y-3.5">
                  {donations.slice(0, 6).map((donation) => (
                    <li key={donation.id} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-track text-sm font-bold text-body">
                        {donation.donor_name ? initialOf(donation.donor_name) : "🤲"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {donation.donor_name ?? (
                            <span className="font-bengali">নাম প্রকাশে অনিচ্ছুক</span>
                          )}
                        </p>
                        <p className="text-sm text-muted">
                          <span className="font-bold text-foreground">
                            {formatTaka(donation.amount)}
                          </span>{" "}
                          · {timeAgo(donation.paid_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-6 border-t border-foreground/10 pt-5 text-sm text-muted">
                Be the first to donate.{" "}
                <span className="font-bengali">প্রথম দাতা হোন।</span>
              </p>
            )}
          </div>
        </aside>

        {/* ===== Left column, part 2: story + everything else ===== */}
        <div className="lg:col-start-1">
          {/* What we actually checked — stated plainly */}
          <div className="flex gap-3 rounded-2xl bg-brand-tint p-5">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-brand-dark"
              aria-hidden="true"
            >
              <path d="M12 2l7 4v6c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <p className="text-sm leading-relaxed text-brand-dark">
              <strong className="font-bold">Verified by Shohay.</strong> We
              checked this organiser&rsquo;s government ID, supporting
              documents and payout account privately before this page went
              live.
            </p>
          </div>

          {charityAllocations.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-card p-5 shadow-soft">
              <p className="font-bold text-brand">
                💚 Funds go directly to verified charities
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {charityAllocations.map((a) => (
                  <li key={a.name} className="flex justify-between gap-4">
                    <span className="text-body">{a.name}</span>
                    <span className="font-bold">{a.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {campaign.summary ? (
            <p className="mt-7 text-lg leading-relaxed text-body sm:text-xl">
              {campaign.summary}
            </p>
          ) : null}
          {campaign.summary_bn ? (
            <p className="font-bengali mt-3 text-lg leading-loose text-body">
              {campaign.summary_bn}
            </p>
          ) : null}

          {campaign.story ? (
            <div className="mt-5 whitespace-pre-line leading-relaxed text-body">
              {campaign.story}
            </div>
          ) : null}
          {campaign.story_bn ? (
            <div className="font-bengali mt-4 whitespace-pre-line leading-relaxed opacity-80">
              {campaign.story_bn}
            </div>
          ) : null}

          {/* Organizer and beneficiary — like GoFundMe */}
          {campaign.organizer_name || campaign.beneficiary_name || creator ? (
            <section className="mt-10 border-t border-foreground/10 pt-8">
              <h2 className="text-xl font-bold">
                Organizer{campaign.beneficiary_name ? " and beneficiary" : ""} ·{" "}
                <span className="font-bengali">আয়োজক</span>
              </h2>
              <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand">
                    {initialOf(
                      campaign.organizer_name ??
                        creator?.display_name ??
                        creator?.username
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {campaign.organizer_name ??
                        creator?.display_name ??
                        creator?.username ??
                        "Organizer"}
                    </p>
                    <p className="text-sm opacity-60">Organizer</p>
                    {campaign.district ? (
                      <p className="text-sm opacity-60">{campaign.district}</p>
                    ) : null}
                    {campaign.organizer_relationship &&
                    RELATIONSHIP_LABELS[campaign.organizer_relationship] ? (
                      <p className="mt-1.5 inline-block rounded-full bg-brand/10 px-3 py-0.5 text-xs font-medium text-brand">
                        {RELATIONSHIP_LABELS[campaign.organizer_relationship]}
                      </p>
                    ) : null}
                    {creator ? (
                      <p className="mt-2">
                        <Link
                          href={`/creator/${creator.username}`}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          View creator profile →
                        </Link>
                      </p>
                    ) : null}
                    {socialLinks.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {socialLinks.map((s) => (
                          <a
                            key={s.key}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium transition hover:border-brand hover:text-brand"
                          >
                            <SocialIcon platform={s.key} size={14} />
                            {s.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {campaign.beneficiary_name ? (
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-bold">
                      {initialOf(campaign.beneficiary_name)}
                    </span>
                    <div>
                      <p className="font-semibold">{campaign.beneficiary_name}</p>
                      <p className="text-sm opacity-60">Beneficiary</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="mt-10 border-t border-foreground/10 pt-8">
            <h2 className="text-xl font-bold">
              Updates · <span className="font-bengali">আপডেট</span>
            </h2>

            {canPostUpdate ? (
              <div className="mt-4">
                <CampaignUpdateForm campaignId={campaign.id} slug={campaign.slug} />
              </div>
            ) : null}

            {updates.length === 0 ? (
              <p className="mt-4 text-sm opacity-60">
                No updates yet.{" "}
                <span className="font-bengali">এখনো কোনো আপডেট নেই।</span>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {updates.map((update) => {
                  const embed = update.video_url
                    ? youtubeEmbedUrl(update.video_url)
                    : null;
                  return (
                    <li
                      key={update.id}
                      className="rounded-xl border border-foreground/10 bg-card p-4"
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {update.body}
                      </p>
                      <SafeImage
                        src={update.image_url}
                        alt=""
                        loading="lazy"
                        className="mt-3 max-h-96 w-full rounded-xl object-cover"
                        fallback={null}
                      />
                      {embed ? (
                        <div className="mt-3 aspect-video overflow-hidden rounded-xl">
                          <iframe
                            src={embed}
                            title="Update video"
                            allowFullScreen
                            className="h-full w-full bg-black"
                          />
                        </div>
                      ) : update.video_url ? (
                        <a
                          href={update.video_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                        >
                          ▶️ Watch video →
                        </a>
                      ) : null}
                      <p className="mt-2 text-xs opacity-50">
                        {timeAgo(update.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Words of support — donor messages at the bottom, like GoFundMe */}
          <section className="mt-10 border-t border-foreground/10 pt-8">
            <h2 className="text-xl font-bold">
              Words of support ·{" "}
              <span className="font-bengali">সমর্থনের বার্তা</span>
            </h2>

            {supportMessages.length === 0 ? (
              <p className="mt-4 text-sm opacity-60">
                Please donate to share words of support.{" "}
                <span className="font-bengali">
                  দান করে সমর্থনের বার্তা লিখুন।
                </span>
              </p>
            ) : (
              <ul className="mt-4 space-y-5">
                {supportMessages.map((donation) => (
                  <li key={donation.id} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">
                      {donation.donor_name ? initialOf(donation.donor_name) : "🤲"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {donation.donor_name ?? (
                          <span className="font-bengali">নাম প্রকাশে অনিচ্ছুক</span>
                        )}
                      </p>
                      <p className="text-xs opacity-60">
                        {formatTaka(donation.amount)} · {timeAgo(donation.paid_at)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed opacity-85">
                        {donation.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 sm:max-w-xs">{donateButton}</div>
          </section>

          <div className="mt-10 rounded-xl border border-foreground/10 bg-card p-4 text-xs leading-relaxed opacity-70">
            <p className="font-semibold">🛡️ Shohay trust & safety</p>
            <p className="mt-1.5">
              Shohay has full authority to remove, refuse, or cancel any
              campaign — and to freeze its funds — if any wrongdoing or
              fraudulent activity is found. An independent third-party audit is
              conducted at the end of every year, and is welcome.
            </p>
            <p className="font-bengali mt-1.5">
              কোনো অনিয়ম বা প্রতারণা পাওয়া গেলে সহায় যেকোনো ক্যাম্পেইন
              সরিয়ে দেওয়ার, প্রত্যাখ্যান বা বাতিল করার এবং তহবিল ফ্রিজ করার
              পূর্ণ কর্তৃত্ব রাখে। প্রতি বছর শেষে স্বাধীন তৃতীয় পক্ষের
              নিরীক্ষা (অডিট) করা হয়।
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
