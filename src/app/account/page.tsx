import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import { Card, ButtonLink, EmptyState } from "@/components/ui";
import { CampaignRow } from "@/components/CampaignRow";
import type { DashboardCampaign } from "@/components/CampaignRow";
import { SetupChecklist } from "@/components/SetupChecklist";
import { accountKind } from "@/lib/account-kind";
import type { ChecklistStep } from "@/components/SetupChecklist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Shohay সহায়" };

/* The bank takes roughly 3% to move money out. Showing the figure net
   of that is what a campaigner can plan around, rather than a number
   they'll be disappointed by later. */
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

  const profileFields = "username, display_name, bio, avatar_url";
  const firstProfile = await supabase
    .from("profiles")
    .select(`${profileFields}, cover_url, full_name, phone, account_kind`)
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
    cover_url: null,
    full_name: null,
    phone: null,
    account_kind: null,
  };

  /* Everything below is worded by what this account raises as: a
     creator runs special projects, a fundraiser runs campaigns, and an
     occasion account runs occasion fundraisers. Same dashboard, same
     numbers — the words just stop being wrong for two of the three. */
  const kind = accountKind(
    (profile as { account_kind?: string | null }).account_kind
  );

  const [dashboardResult, memberResult, postsResult, referralResult] =
    await Promise.all([
      supabase.rpc("my_campaign_dashboard"),
      supabase.rpc("my_membership_stats"),
      supabase
        .from("creator_posts")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id),
      supabase.rpc("my_referral_stats", { since: null }),
    ]);

  const campaigns = (dashboardResult.data ?? []) as DashboardCampaign[];
  const memberStats = (memberResult.data?.[0] as
    | { supporters: number; monthly_total: number }
    | undefined) ?? { supporters: 0, monthly_total: 0 };
  const postCount = postsResult.count ?? 0;
  const referred = (referralResult.data?.[0] as
    | { total_raised: number }
    | undefined) ?? { total_raised: 0 };

  const { count: tierCount } = await supabase
    .from("membership_tiers")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id)
    .eq("active", true);

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

  const steps: ChecklistStep[] = [
    {
      key: "page",
      title: "Set up your page",
      hint: "Your address, your name and what you raise for",
      href: profile.username ? "/account/my-page" : "/setup",
      done: Boolean(profile.username),
    },
    {
      key: "photo",
      title: "Add a photo and a few words",
      hint: "People give to a face and a reason, not a blank page",
      href: "/account/my-page",
      done: Boolean(profile.avatar_url && profile.bio),
    },
    {
      key: "post",
      title: "Write your first post",
      hint: "Something public, so the page isn't empty when people arrive",
      href: "/account/posts",
      done: postCount > 0,
    },
    {
      key: "tier",
      title: "Add a monthly supporter tier",
      hint: "Steady support is what lets you plan ahead",
      href: "/account/supporters",
      done: (tierCount ?? 0) > 0,
    },
    {
      key: "campaign",
      title:
        campaigns.length > 0
          ? kind.startLabel
          : kind.key === "creator"
            ? "Raise for a special project"
            : `Start your first ${kind.noun}`,
      hint: kind.startHint,
      href: "/start",
      done: campaigns.length > 0,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user.email}
            {profile.phone ? ` · ${profile.phone}` : ""}
          </p>
        </div>
        <ButtonLink href="/start" size="sm" className="shrink-0">
          {kind.startLabel}
        </ButtonLink>
      </div>

      {created ? (
        <p className="mt-5 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">
          Submitted — your {kind.noun} is with our verification team and will
          appear publicly once approved.
        </p>
      ) : null}

      <div className="mt-6">
        <SetupChecklist steps={steps} />
      </div>

      {/* ===== The numbers ===== */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          value={formatTaka(totalRaised)}
          label={`Raised, all ${kind.nounPlural}`}
          hint={
            totalRaised > 0
              ? `≈ ${formatTaka(afterFee)} after bank charges`
              : undefined
          }
          highlight
        />
        <Stat
          value={totalViews.toLocaleString("en-US")}
          label={`${kind.noun === "project" ? "Project" : "Campaign"} views`}
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
          value={formatTaka(Number(memberStats.monthly_total))}
          label="Pledged each month"
          hint={
            Number(memberStats.supporters) > 0
              ? `${memberStats.supporters} supporter${Number(memberStats.supporters) === 1 ? "" : "s"}`
              : undefined
          }
        />
      </div>

      {Number(referred.total_raised) > 0 ? (
        <p className="mt-3 text-sm text-muted">
          Plus{" "}
          <b className="text-brand">
            {formatTaka(Number(referred.total_raised))}
          </b>{" "}
          you brought in for other people&rsquo;s campaigns —{" "}
          <Link href="/account/insights" className="font-semibold text-brand">
            see where
          </Link>
          .
        </p>
      ) : null}

      {/* ===== Campaigns ===== */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          Your {kind.nounPlural}
          {live > 0 ? ` · ${live} live` : ""}
        </h2>
        {campaigns.length > 0 ? (
          <Link
            href="/account/insights"
            className="text-sm font-bold text-brand"
          >
            See which one is raising ↗
          </Link>
        ) : null}
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={`No ${kind.nounPlural} yet`}
            bn={`এখনো কোনো ${kind.nounBn} নেই`}
            hint={`Every ${kind.noun} is checked by our team before it goes live, so start early.`}
            action={<ButtonLink href="/start">{kind.startLabel}</ButtonLink>}
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
    </>
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
      <p className={`text-2xl font-extrabold ${highlight ? "text-brand" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-body">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
