import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import { Card, ButtonLink, EmptyState } from "@/components/ui";
import { CreatorProfileForm } from "./CreatorProfileForm";
import { ReferralPanel } from "@/components/ReferralPanel";
import type {
  ReferralStats,
  ReferredCampaign,
} from "@/components/ReferralPanel";
import { OverlayPanel } from "@/components/OverlayPanel";
import { CampaignRow } from "@/components/CampaignRow";
import type { DashboardCampaign } from "@/components/CampaignRow";
import { siteUrl } from "@/app/layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Shohay সহায়" };

/* The bank takes roughly 3% to move money out. Showing the figure net
   of that is the number a campaigner can actually plan around, rather
   than one they'll be disappointed by later. */
const BANK_FEE = 0.03;

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

  // social_links / full_name / phone each arrive with a later SQL
  // script, so fall back rather than breaking the whole page.
  const profileFields = "username, display_name, bio, avatar_url";
  const firstProfile = await supabase
    .from("profiles")
    .select(`${profileFields}, social_links, full_name, phone`)
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
    full_name: null,
    phone: null,
    social_links: null,
  };

  const [dashboardResult, statsResult, referredResult, overlayResult, memberResult] =
    await Promise.all([
      supabase.rpc("my_campaign_dashboard"),
      supabase.rpc("my_referral_stats", { since: null }),
      supabase.rpc("my_referral_campaigns", { max_rows: 5 }),
      supabase.rpc("my_overlay_key"),
      supabase.rpc("my_membership_stats"),
    ]);

  const campaigns = (dashboardResult.data ?? []) as DashboardCampaign[];
  const overlayKey = (overlayResult.data as string | null) ?? null;
  const referralStats: ReferralStats = (statsResult.data?.[0] as
    | ReferralStats
    | undefined) ?? {
    total_raised: 0,
    donation_count: 0,
    supporters: 0,
    campaigns_helped: 0,
  };
  const referredCampaigns = (referredResult.data ?? []) as ReferredCampaign[];
  const memberStats = (memberResult.data?.[0] as
    | { supporters: number; monthly_total: number }
    | undefined) ?? { supporters: 0, monthly_total: 0 };

  // Totals across every campaign they run.
  const totalRaised = campaigns.reduce(
    (sum, c) => sum + (Number(c.raised_amount) || 0),
    0
  );
  const totalViews = campaigns.reduce(
    (sum, c) => sum + (Number(c.views) || 0),
    0
  );
  const totalDonors = campaigns.reduce(
    (sum, c) => sum + (Number(c.donors) || 0),
    0
  );
  const totalDonations = campaigns.reduce(
    (sum, c) => sum + (Number(c.donations) || 0),
    0
  );
  const live = campaigns.filter((c) => c.status === "approved").length;
  const averageGift = totalDonations > 0 ? totalRaised / totalDonations : 0;
  const afterFee = Math.round(totalRaised * (1 - BANK_FEE));

  const name =
    profile.display_name ??
    profile.full_name ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-20 sm:px-6">
      {/* ===== Who you are ===== */}
      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-tint text-2xl font-bold text-brand-dark">
              {name.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold">{name}</h1>
            <p className="mt-0.5 truncate text-sm text-muted">
              {user.email}
              {profile.phone ? ` · ${profile.phone}` : ""}
            </p>
            {profile.username ? (
              <Link
                href={`/creator/${profile.username}`}
                className="press mt-1 inline-block text-sm font-bold text-brand"
              >
                shohay.org/creator/{profile.username} →
              </Link>
            ) : (
              <p className="mt-1 text-sm text-muted">
                No public page yet — pick a username below.
              </p>
            )}
          </div>

          <ButtonLink href="/start" size="sm" className="shrink-0">
            Start a campaign
          </ButtonLink>
        </div>
      </Card>

      {created ? (
        <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">
          Submitted — your campaign is with our verification team and will
          appear publicly once approved.
        </p>
      ) : null}

      {/* ===== The numbers ===== */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          value={formatTaka(totalRaised)}
          label="Raised, all campaigns"
          hint={
            totalRaised > 0
              ? `≈ ${formatTaka(afterFee)} after bank charges`
              : undefined
          }
          highlight
        />
        <Stat
          value={totalViews.toLocaleString("en-US")}
          label="Campaign views"
          hint={totalViews === 0 ? "Counting from today" : undefined}
        />
        <Stat
          value={totalDonors.toLocaleString("en-US")}
          label="People who gave"
          hint={
            averageGift > 0
              ? `${formatTaka(Math.round(averageGift))} average`
              : undefined
          }
        />
        <Stat
          value={String(live)}
          label={live === 1 ? "Campaign live" : "Campaigns live"}
          hint={
            Number(memberStats.monthly_total) > 0
              ? `+ ${formatTaka(Number(memberStats.monthly_total))}/mo pledged`
              : undefined
          }
        />
      </div>

      {/* ===== Campaigns ===== */}
      <h2 className="mt-10 text-xl font-bold">
        Your campaigns · <span className="font-bengali">আপনার ক্যাম্পেইন</span>
      </h2>

      {campaigns.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No campaigns yet"
            bn="এখনো কোনো ক্যাম্পেইন নেই"
            hint="Every campaign is checked by our team before it goes live, so start early."
            action={<ButtonLink href="/start">Start a campaign</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {campaigns.map((c) => (
            <li key={c.campaign_id}>
              <CampaignRow campaign={c} />
            </li>
          ))}
        </ul>
      )}

      {/* ===== Tools ===== */}
      <h2 className="mt-12 text-xl font-bold">Grow your support</h2>

      <div className="mt-4 space-y-5">
        <ReferralPanel
          username={profile.username}
          siteUrl={siteUrl}
          stats={referralStats}
          campaigns={referredCampaigns}
        />

        <Link
          href="/account/supporters"
          className="lift flex items-center justify-between gap-4 rounded-2xl bg-card p-5 shadow-soft no-underline"
        >
          <span>
            <span className="block font-bold">
              Monthly supporters
              {Number(memberStats.supporters) > 0 ? (
                <span className="ml-2 text-brand">
                  {memberStats.supporters}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              Tiers, supporters-only posts and who&rsquo;s supporting you
            </span>
          </span>
          <span className="shrink-0 text-xl opacity-40">›</span>
        </Link>

        <OverlayPanel overlayKey={overlayKey} siteUrl={siteUrl} />
      </div>

      {/* ===== Profile ===== */}
      <h2 className="mt-12 text-xl font-bold">Your profile</h2>
      <div className="mt-4">
        <CreatorProfileForm profile={profile} email={user.email} />
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
  hint,
  highlight = false,
}: {
  value: string;
  label: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card className="p-5">
      <p
        className={`text-2xl font-extrabold ${highlight ? "text-brand" : ""}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-body">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
