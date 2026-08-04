import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics — Shohay সহায়" };

const DAY_MS = 24 * 60 * 60 * 1000;

type ViewRow = { campaign_id: string | null; created_at: string };
type DonationRow = {
  campaign_id: string;
  amount: number;
  message: string | null;
  status: string;
  paid_at: string | null;
};

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-2xl font-bold text-brand">{value}</p>
      <p className="mt-1 text-sm opacity-60">{label}</p>
      {sub ? <p className="mt-0.5 text-xs opacity-40">{sub}</p> : null}
    </div>
  );
}

// Kept outside the component so render stays pure (eslint react-hooks/purity).
function splitRecent(views: ViewRow[]): { views7: number; views30: number } {
  const now = Date.now();
  let views7 = 0;
  let views30 = 0;
  for (const v of views) {
    const age = now - +new Date(v.created_at);
    if (age <= 7 * DAY_MS) views7 += 1;
    if (age <= 30 * DAY_MS) views30 += 1;
  }
  return { views7, views30 };
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data: campaignRows } = await supabase
    .from("campaigns")
    .select("id, slug, title, status, goal_amount, raised_amount, created_at")
    .order("created_at", { ascending: false });
  const campaigns = (campaignRows ?? []) as Campaign[];

  // Page views — table exists only after campaigner-tools.sql has run.
  const { data: viewRows, error: viewsError } = await supabase
    .from("page_views")
    .select("campaign_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50000);
  const views = (viewRows ?? []) as ViewRow[];

  const { data: donationRows } = await supabase
    .from("donations")
    .select("campaign_id, amount, message, status, paid_at")
    .eq("status", "paid")
    .limit(50000);
  const donations = (donationRows ?? []) as DonationRow[];

  const { views7, views30 } = splitRecent(views);

  const viewsByCampaign = new Map<string, number>();
  for (const v of views) {
    if (!v.campaign_id) continue;
    viewsByCampaign.set(v.campaign_id, (viewsByCampaign.get(v.campaign_id) ?? 0) + 1);
  }

  const donationsByCampaign = new Map<string, { count: number; amount: number; messages: number }>();
  for (const d of donations) {
    const entry = donationsByCampaign.get(d.campaign_id) ?? {
      count: 0,
      amount: 0,
      messages: 0,
    };
    entry.count += 1;
    entry.amount += Number(d.amount);
    if (d.message) entry.messages += 1;
    donationsByCampaign.set(d.campaign_id, entry);
  }

  const rows = campaigns.map((c) => {
    const v = viewsByCampaign.get(c.id) ?? 0;
    const d = donationsByCampaign.get(c.id) ?? { count: 0, amount: 0, messages: 0 };
    // Conversion: of the people who viewed, how many donated?
    const conversion = v > 0 ? Math.round((d.count / v) * 100) : 0;
    return { campaign: c, views: v, ...d, conversion };
  });

  const byViews = [...rows].sort((a, b) => b.views - a.views).slice(0, 10);
  const byAmount = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 10);
  const byEngagement = [...rows]
    .sort((a, b) => b.count + b.messages * 2 - (a.count + a.messages * 2))
    .slice(0, 10);

  const maxViews = byViews[0]?.views ?? 0;
  const maxAmount = byAmount[0]?.amount ?? 0;

  const totalDonated = donations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="opacity-60 hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-bold">
        📈 Analytics · <span className="font-bengali">বিশ্লেষণ</span>
      </h1>

      {viewsError ? (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          ⚠️ Visitor tracking isn&rsquo;t active yet — run{" "}
          <code className="rounded bg-foreground/10 px-1">
            supabase/campaigner-tools.sql
          </code>{" "}
          in the Supabase SQL Editor to enable it. Donation stats below still
          work.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Views — last 7 days" value={String(views7)} />
        <StatTile label="Views — last 30 days" value={String(views30)} />
        <StatTile label="Views — all time" value={String(views.length)} />
        <StatTile
          label="Donations — all time"
          value={String(donations.length)}
          sub={formatTaka(totalDonated)}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">👀 Most viewed campaigns</h2>
        {byViews.every((r) => r.views === 0) ? (
          <p className="mt-3 text-sm opacity-60">
            No views recorded yet — they&rsquo;ll appear as visitors open
            campaign pages.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 rounded-2xl border border-foreground/10 bg-card p-5">
            {byViews
              .filter((r) => r.views > 0)
              .map((r) => (
                <li key={r.campaign.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <Link
                      href={`/admin/${r.campaign.id}`}
                      className="truncate font-medium hover:text-brand"
                    >
                      {r.campaign.title}
                    </Link>
                    <span className="whitespace-nowrap opacity-60">
                      {r.views} view{r.views === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={r.views} max={maxViews} />
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">💰 Top by money raised</h2>
        <ul className="mt-4 space-y-3 rounded-2xl border border-foreground/10 bg-card p-5">
          {byAmount
            .filter((r) => r.amount > 0)
            .map((r) => (
              <li key={r.campaign.id}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <Link
                    href={`/admin/${r.campaign.id}`}
                    className="truncate font-medium hover:text-brand"
                  >
                    {r.campaign.title}
                  </Link>
                  <span className="whitespace-nowrap font-semibold text-brand">
                    {formatTaka(r.amount)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar value={r.amount} max={maxAmount} />
                </div>
              </li>
            ))}
          {byAmount.every((r) => r.amount === 0) ? (
            <li className="text-sm opacity-60">No donations yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">🔥 Engagement & conversion</h2>
        <p className="mt-1 text-sm opacity-60">
          Donations, support messages, and what share of viewers donate.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 text-right font-semibold">Views</th>
                <th className="px-4 py-3 text-right font-semibold">Donations</th>
                <th className="px-4 py-3 text-right font-semibold">Messages</th>
                <th className="px-4 py-3 text-right font-semibold">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {byEngagement.map((r) => (
                <tr key={r.campaign.id} className="transition hover:bg-foreground/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${r.campaign.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {r.campaign.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right opacity-70">{r.views}</td>
                  <td className="px-4 py-3 text-right">{r.count}</td>
                  <td className="px-4 py-3 text-right">{r.messages}</td>
                  <td className="px-4 py-3 text-right">
                    {r.views > 0 ? `${r.conversion}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
