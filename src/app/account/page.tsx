import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka, formatCampaignId } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { CreatorProfileForm } from "./CreatorProfileForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My campaigns — Shohay সহায়" };

const STATUS_LABEL: Record<Campaign["status"], { en: string; className: string }> = {
  draft: { en: "Draft", className: "bg-foreground/10 text-foreground" },
  pending: { en: "Pending review", className: "bg-amber-500/15 text-amber-700" },
  approved: { en: "Live", className: "bg-brand/15 text-brand" },
  rejected: { en: "Needs changes", className: "bg-accent/15 text-accent" },
  completed: { en: "Completed", className: "bg-foreground/10 text-foreground" },
  frozen: { en: "Frozen", className: "bg-sky-500/15 text-sky-700" },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { created } = await searchParams;

  // social_links exists only after creator-page.sql — fall back.
  const profileFields = "username, display_name, bio, avatar_url";
  const firstProfile = await supabase
    .from("profiles")
    .select(`${profileFields}, social_links`)
    .eq("id", user.id)
    .maybeSingle();
  let profileRow = firstProfile.data;
  if (firstProfile.error) {
    const retry = await supabase
      .from("profiles")
      .select(profileFields)
      .eq("id", user.id)
      .maybeSingle();
    profileRow = retry.data as unknown as typeof profileRow;
  }
  const profile = profileRow ?? {
    username: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    social_links: null,
  };

  const listFields =
    "id, slug, title, title_bn, category, goal_amount, raised_amount, status, district, created_at";
  let { data, error } = await supabase
    .from("campaigns")
    .select(`${listFields}, campaign_no`)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    // campaign_no exists only after campaign-ids.sql — fall back safely.
    const retry = await supabase
      .from("campaigns")
      .select(listFields)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    data = (retry.data ?? []) as unknown as typeof data;
    error = retry.error;
  }

  if (error) console.error("Failed to load your campaigns:", error.message);
  const campaigns = (data ?? []) as Campaign[];

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="mt-10 text-2xl font-bold">
          My campaigns · <span className="font-bengali">আমার ক্যাম্পেইন</span>
        </h1>

        <div className="mt-6">
          <CreatorProfileForm profile={profile} />
        </div>

        {created ? (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-brand">
            Submitted! Your campaign is pending review — it will appear
            publicly once approved.
          </div>
        ) : null}

        {campaigns.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
            You haven&rsquo;t started a campaign yet.
            <div className="mt-4">
              <Link
                href="/start"
                className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Start a campaign
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {campaigns.map((campaign) => {
              const status = STATUS_LABEL[campaign.status];
              return (
                <li key={campaign.id}>
                  <Link
                    href={`/account/campaigns/${campaign.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 bg-card p-4 transition hover:border-brand/50"
                  >
                    <div>
                      <p className="font-semibold">{campaign.title}</p>
                      {campaign.title_bn ? (
                        <p className="font-bengali text-sm opacity-70">
                          {campaign.title_bn}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm opacity-60">
                        {formatTaka(campaign.raised_amount)} of{" "}
                        {formatTaka(campaign.goal_amount)}
                        {formatCampaignId(campaign.campaign_no) ? (
                          <span>
                            {" "}
                            · ID {formatCampaignId(campaign.campaign_no)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.en}
                      </span>
                      <span className="text-xs font-medium text-brand">
                        Manage →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
