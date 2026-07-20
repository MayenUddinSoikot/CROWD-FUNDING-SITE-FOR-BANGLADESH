import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign } from "@/lib/types";
import { formatTaka, percentRaised } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { DonationForm } from "@/components/DonationForm";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

async function getCampaign(slug: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("campaigns")
      .select(
        "id, slug, title, title_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, created_at"
      )
      .eq("slug", slug)
      .in("status", ["approved", "completed"])
      .maybeSingle();
    return (data as Campaign) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  return { title: campaign ? `Donate — ${campaign.title}` : "Donate — Shohay" };
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const percent = percentRaised(campaign.raised_amount, campaign.goal_amount);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
        <p className="mt-6 text-sm">
          <Link href={`/campaigns/${slug}`} className="opacity-60 hover:text-brand">
            ← Back to campaign
          </Link>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Donation form */}
          <div className="order-2 lg:order-1">
            <h1 className="font-serif text-2xl font-bold">
              You&rsquo;re donating to
            </h1>
            <p className="mt-1 text-lg">{campaign.title}</p>
            {campaign.beneficiary_name ? (
              <p className="text-sm opacity-60">
                For {campaign.beneficiary_name}
              </p>
            ) : null}

            <div className="mt-6">
              <DonationForm campaignId={campaign.id} slug={campaign.slug} />
            </div>
          </div>

          {/* Summary sidebar */}
          <aside className="order-1 lg:order-2">
            <div className="rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm lg:sticky lg:top-6">
              {campaign.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.cover_image_url}
                  alt=""
                  className="mb-4 h-32 w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="text-xl font-bold text-brand">
                {formatTaka(campaign.raised_amount)}
              </p>
              <p className="text-sm opacity-60">
                raised of {formatTaka(campaign.goal_amount)} · {percent}%
              </p>
              <div className="mt-3">
                <ProgressBar percent={percent} />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
