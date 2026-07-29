import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignMedia,
  CampaignUpdate,
  PublicDonation,
} from "@/lib/types";
import { CATEGORY_LABELS, RELATIONSHIP_LABELS, OCCASION_LABELS } from "@/lib/types";
import { formatTaka, timeAgo } from "@/lib/format";
import { RealtimeCampaignStats } from "@/components/RealtimeCampaignStats";
import { ShareButtons } from "@/components/ShareButtons";
import { MediaCarousel } from "@/components/MediaCarousel";
import { CampaignUpdateForm } from "@/components/CampaignUpdateForm";
import { SiteHeader } from "@/components/SiteHeader";

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

async function getCampaign(slug: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, video_url, beneficiary_name, organizer_name, organizer_relationship, campaign_type, occasion, district, ends_at, created_at"
      )
      .eq("slug", slug)
      .in("status", ["approved", "completed"])
      .maybeSingle();

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

async function getUpdates(campaignId: string): Promise<CampaignUpdate[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("campaign_updates")
      .select("id, campaign_id, body, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(50);
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
  const category = CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
  const remaining = daysLeft(campaign.ends_at);

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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <div className="mt-8">
          <MediaCarousel media={media} fallbackEmoji={category.emoji} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
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
        </div>

        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">
          {campaign.title}
        </h1>
        {campaign.title_bn ? (
          <p className="font-bengali mt-2 text-xl opacity-80">
            {campaign.title_bn}
          </p>
        ) : null}

        {campaign.organizer_name ||
        campaign.beneficiary_name ||
        campaign.organizer_relationship ? (
          <div className="mt-4 rounded-xl border border-foreground/10 bg-card p-4 text-sm">
            {campaign.organizer_name ? (
              <p>
                <span className="opacity-60">Raised by </span>
                <span className="font-semibold">{campaign.organizer_name}</span>
                {campaign.beneficiary_name ? (
                  <>
                    <span className="opacity-60"> for </span>
                    <span className="font-semibold">
                      {campaign.beneficiary_name}
                    </span>
                  </>
                ) : null}
              </p>
            ) : campaign.beneficiary_name ? (
              <p>
                <span className="opacity-60">For: </span>
                <span className="font-semibold">
                  {campaign.beneficiary_name}
                </span>
              </p>
            ) : null}
            {campaign.organizer_relationship &&
            RELATIONSHIP_LABELS[campaign.organizer_relationship] ? (
              <p className="mt-1 inline-block rounded-full bg-brand/10 px-3 py-0.5 text-xs font-medium text-brand">
                {RELATIONSHIP_LABELS[campaign.organizer_relationship]}
              </p>
            ) : null}
          </div>
        ) : null}

        {charityAllocations.length > 0 ? (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
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

        <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
          {remaining !== null ? (
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
          />

          <Link
            href={`/campaigns/${campaign.slug}/donate`}
            className="mt-5 block w-full rounded-xl bg-brand px-6 py-3.5 text-center text-lg font-semibold text-white transition hover:bg-brand-dark"
          >
            {campaign.campaign_type === "creator" ? (
              <>Buy a cha ☕ · <span className="font-bengali">চা খাওয়ান</span></>
            ) : (
              <>Donate now · <span className="font-bengali">দান করুন</span></>
            )}
          </Link>

          <div className="mt-6 border-t border-foreground/10 pt-4">
            <ShareButtons title={campaign.title} />
          </div>
        </div>

        {campaign.summary ? (
          <p className="mt-8 text-lg leading-relaxed opacity-90">
            {campaign.summary}
          </p>
        ) : null}
        {campaign.summary_bn ? (
          <p className="font-bengali mt-3 leading-relaxed opacity-80">
            {campaign.summary_bn}
          </p>
        ) : null}

        {campaign.story ? (
          <div className="mt-6 whitespace-pre-line leading-relaxed opacity-80">
            {campaign.story}
          </div>
        ) : null}
        {campaign.story_bn ? (
          <div className="font-bengali mt-4 whitespace-pre-line leading-relaxed opacity-80">
            {campaign.story_bn}
          </div>
        ) : null}

        <section className="mt-10">
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
              {updates.map((update) => (
                <li
                  key={update.id}
                  className="rounded-xl border border-foreground/10 bg-card p-4"
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {update.body}
                  </p>
                  <p className="mt-2 text-xs opacity-50">
                    {timeAgo(update.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Recent donations ·{" "}
            <span className="font-bengali">সাম্প্রতিক দান</span>
          </h2>

          {donations.length === 0 ? (
            <p className="mt-4 text-sm opacity-60">
              Be the first to donate.{" "}
              <span className="font-bengali">প্রথম দাতা হোন।</span>
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {donations.map((donation) => (
                <li
                  key={donation.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-foreground/10 bg-card p-4"
                >
                  <div>
                    <p className="font-medium">
                      {donation.donor_name ?? "Anonymous · নাম প্রকাশে অনিচ্ছুক"}
                    </p>
                    {donation.message ? (
                      <p className="mt-1 text-sm opacity-70">
                        {donation.message}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs opacity-50">
                      {timeAgo(donation.paid_at)}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-brand">
                    {formatTaka(donation.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
