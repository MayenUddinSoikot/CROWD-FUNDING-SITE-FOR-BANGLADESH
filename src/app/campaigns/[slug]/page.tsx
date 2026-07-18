import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Campaign, PublicDonation } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatTaka, percentRaised, timeAgo } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { SiteHeader } from "@/components/SiteHeader";

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

async function getCampaign(slug: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, district, ends_at, created_at"
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
  const category = CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
  const percent = percentRaised(campaign.raised_amount, campaign.goal_amount);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        {campaign.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.cover_image_url}
            alt=""
            className="mt-8 h-64 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="mt-8 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-6xl">
            {category.emoji}
          </div>
        )}

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-brand">
          {category.en} · <span className="font-bengali">{category.bn}</span>
          {campaign.district ? (
            <span className="opacity-70"> · {campaign.district}</span>
          ) : null}
        </p>

        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          {campaign.title}
        </h1>
        {campaign.title_bn ? (
          <p className="font-bengali mt-2 text-xl opacity-80">
            {campaign.title_bn}
          </p>
        ) : null}

        {campaign.beneficiary_name ? (
          <p className="mt-3 text-sm opacity-60">
            For: {campaign.beneficiary_name}
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-foreground/10 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-brand">
              {formatTaka(campaign.raised_amount)}
            </p>
            <p className="text-sm opacity-60">
              raised of {formatTaka(campaign.goal_amount)} goal
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar percent={percent} />
          </div>
          <p className="mt-2 text-sm opacity-60">
            {percent}% funded · {donations.length} donation
            {donations.length === 1 ? "" : "s"}
          </p>

          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-xl bg-brand/40 px-6 py-3 font-semibold text-white"
            title="Online donations open soon"
          >
            Donate · <span className="font-bengali">দান করুন</span> — coming
            soon
          </button>
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
                  className="flex items-start justify-between gap-4 rounded-xl border border-foreground/10 p-4"
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
