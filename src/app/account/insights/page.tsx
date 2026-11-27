import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import { Card, EmptyState, ButtonLink } from "@/components/ui";
import type { DashboardCampaign } from "@/components/CampaignRow";
import { ReferralPanel } from "@/components/ReferralPanel";
import type { ReferralStats, ReferredCampaign } from "@/components/ReferralPanel";
import { siteUrl } from "@/app/layout";
import { accountKind } from "@/lib/account-kind";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Insights — Shohay সহায়" };

export default async function InsightsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dash, stats, referred, profile] = await Promise.all([
    supabase.rpc("my_campaign_dashboard"),
    supabase.rpc("my_referral_stats", { since: null }),
    supabase.rpc("my_referral_campaigns", { max_rows: 8 }),
    supabase
      .from("profiles")
      .select("username, account_kind")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const campaigns = (dash.data ?? []) as DashboardCampaign[];
  const referralStats: ReferralStats = (stats.data?.[0] as
    | ReferralStats
    | undefined) ?? {
    total_raised: 0,
    donation_count: 0,
    supporters: 0,
    campaigns_helped: 0,
  };
  const referredCampaigns = (referred.data ?? []) as ReferredCampaign[];
  const kind = accountKind(
    (profile.data as { account_kind?: string | null } | null)?.account_kind
  );

  const best = [...campaigns].sort(
    (a, b) => Number(b.views) - Number(a.views)
  )[0];

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Insights</h1>
      <p className="mt-1 text-sm text-muted">
        Views say whether anyone is arriving. The percentage says whether the
        page convinces the ones who do. They are different problems.
      </p>

      {campaigns.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to measure yet"
            hint={`Numbers appear here once you have a ${kind.noun} and people start opening it.`}
            action={<ButtonLink href="/start">{kind.startLabel}</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4 font-bold">
                    {kind.noun === "project" ? "Project" : "Campaign"}
                  </th>
                  <th className="pb-3 pr-4 font-bold">Raised</th>
                  <th className="pb-3 pr-4 font-bold">Views</th>
                  <th className="pb-3 pr-4 font-bold">7 days</th>
                  <th className="pb-3 pr-4 font-bold">Donors</th>
                  <th className="pb-3 font-bold">Gave</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const views = Number(c.views) || 0;
                  const donations = Number(c.donations) || 0;
                  const rate = views > 0 ? (donations / views) * 100 : null;
                  return (
                    <tr
                      key={c.campaign_id}
                      className="border-b border-foreground/[0.06]"
                    >
                      <td className="max-w-[240px] py-3 pr-4">
                        <Link
                          href={`/account/campaigns/${c.campaign_id}`}
                          className="block truncate font-semibold hover:text-brand"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-bold text-brand">
                        {formatTaka(Number(c.raised_amount) || 0)}
                      </td>
                      <td className="py-3 pr-4">{views.toLocaleString("en-US")}</td>
                      <td className="py-3 pr-4">
                        {(Number(c.views_7d) || 0).toLocaleString("en-US")}
                      </td>
                      <td className="py-3 pr-4">{Number(c.donors) || 0}</td>
                      <td className="py-3 font-semibold">
                        {rate === null ? "—" : `${rate.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {best && Number(best.views) > 0 ? (
            <Card className="mt-6 p-5">
              <p className="font-bold">What the numbers are telling you</p>
              <p className="mt-2 text-sm leading-relaxed text-body">
                <b>{best.title}</b> is getting the most attention
                {Number(best.donations) === 0
                  ? " — but nobody has given yet. That usually means the page, not the sharing: check the photo, the first two lines of the story, and whether the goal looks achievable."
                  : ` — ${Number(best.donors)} ${Number(best.donors) === 1 ? "person has" : "people have"} given. Share it in more places; the page is clearly working.`}
              </p>
            </Card>
          ) : null}
        </>
      )}

      <h2 className="mt-12 text-xl font-bold">What you brought in for others</h2>
      <div className="mt-4">
        <ReferralPanel
          username={(profile.data?.username as string | null) ?? null}
          siteUrl={siteUrl}
          stats={referralStats}
          campaigns={referredCampaigns}
        />
      </div>
    </>
  );
}
