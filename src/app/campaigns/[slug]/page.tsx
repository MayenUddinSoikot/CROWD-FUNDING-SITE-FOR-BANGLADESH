import type { Metadata } from "next";
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
import { TrackView } from "@/components/TrackView";
import { formatTaka, timeAgo, formatCampaignId } from "@/lib/format";
import { RealtimeCampaignStats } from "@/components/RealtimeCampaignStats";
import { ShareButtons } from "@/components/ShareButtons";
import { MediaCarousel } from "@/components/MediaCarousel";
import { CampaignUpdateForm } from "@/components/CampaignUpdateForm";

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
  return {
    title: `${campaign.title} — Shohay সহায়`,
    description: campaign.summary ?? undefined,
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

  const donations = await getDonations(campaign.id);
  const updates = await getUpdates(campaign.id);
  const media = await getMedia(campaign.id);
  const charityAllocations = await getCharityAllocations(campaign.id);
  const creator = campaign.creator_id
    ? await getCreator(campaign.creator_id)
    : null;
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
  let canPostUpdate = false;
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: owned } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaign.id)
        .eq("creator_id", user.id)
        .maybeSingle();
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      canPostUpdate = Boolean(owned) || Boolean(profile?.is_admin);
    }
  }

  const donateButton = (
    <Link
      href={`/campaigns/${campaign.slug}/donate`}
      className="block w-full rounded-full bg-brand px-6 py-3.5 text-center text-lg font-semibold text-white transition hover:bg-brand-dark"
    >
      {campaign.campaign_type === "creator" ? (
        <>Buy a cha ☕ · <span className="font-bengali">চা খাওয়ান</span></>
      ) : (
        <>Donate now · <span className="font-bengali">দান করুন</span></>
      )}
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
      <TrackView campaignId={campaign.id} />
      <h1 className="mt-8 font-serif text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
        {campaign.title}
      </h1>
      {campaign.title_bn ? (
        <p className="font-bengali mt-2 text-lg opacity-80 sm:text-xl">
          {campaign.title_bn}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        {/* ===== Left column, part 1: media + organizer line ===== */}
        <div className="lg:col-start-1">
          <MediaCarousel media={media} fallbackEmoji={category.emoji} />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {campaign.campaign_type === "creator" ? (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                ☕ Creator support
              </span>
            ) : null}
            {campaign.occasion && OCCASION_LABELS[campaign.occasion] ? (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {OCCASION_LABELS[campaign.occasion].emoji}{" "}
                {OCCASION_LABELS[campaign.occasion].label} fundraiser
              </span>
            ) : null}
            <span className="text-xs font-medium uppercase tracking-wide text-brand">
              {category.en} · <span className="font-bengali">{category.bn}</span>
              {campaign.district ? (
                <span className="opacity-70"> · {campaign.district}</span>
              ) : null}
            </span>
            {formatCampaignId(campaign.campaign_no) ? (
              <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs font-medium opacity-60">
                ID {formatCampaignId(campaign.campaign_no)}
              </span>
            ) : null}
          </div>

          {campaign.organizer_name || campaign.beneficiary_name ? (
            <div className="mt-4 flex items-center gap-3 border-b border-foreground/10 pb-4 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand">
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
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm lg:sticky lg:top-24">
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

            <div className="mt-5">{donateButton}</div>

            <div className="mt-4 border-t border-foreground/10 pt-4">
              <ShareButtons title={campaign.title} />
            </div>

            {donations.length > 0 ? (
              <ul className="mt-5 space-y-4 border-t border-foreground/10 pt-5">
                {donations.slice(0, 6).map((donation) => (
                  <li key={donation.id} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">
                      {donation.donor_name ? initialOf(donation.donor_name) : "🤲"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {donation.donor_name ?? (
                          <span className="font-bengali">নাম প্রকাশে অনিচ্ছুক</span>
                        )}
                      </p>
                      <p className="text-sm opacity-60">
                        <span className="font-semibold text-foreground">
                          {formatTaka(donation.amount)}
                        </span>{" "}
                        · {timeAgo(donation.paid_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 border-t border-foreground/10 pt-5 text-sm opacity-60">
                Be the first to donate.{" "}
                <span className="font-bengali">প্রথম দাতা হোন।</span>
              </p>
            )}
          </div>
        </aside>

        {/* ===== Left column, part 2: story + everything else ===== */}
        <div className="lg:col-start-1">
          {charityAllocations.length > 0 ? (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
              <p className="font-semibold text-brand">
                💚 Funds go directly to verified charities
              </p>
              <ul className="mt-2 space-y-1">
                {charityAllocations.map((a) => (
                  <li key={a.name} className="flex justify-between">
                    <span>{a.name}</span>
                    <span className="font-semibold">{a.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {campaign.summary ? (
            <p className="mt-6 text-lg leading-relaxed opacity-90">
              {campaign.summary}
            </p>
          ) : null}
          {campaign.summary_bn ? (
            <p className="font-bengali mt-3 leading-relaxed opacity-80">
              {campaign.summary_bn}
            </p>
          ) : null}

          {campaign.story ? (
            <div className="mt-5 whitespace-pre-line leading-relaxed opacity-80">
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
                            className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium transition hover:border-brand hover:text-brand"
                          >
                            {s.emoji} {s.label}
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
                      {update.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={update.image_url}
                          alt=""
                          loading="lazy"
                          className="mt-3 max-h-96 w-full rounded-xl object-cover"
                        />
                      ) : null}
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
