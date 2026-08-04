import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finance — Shohay সহায়" };

const DAY_MS = 24 * 60 * 60 * 1000;
const FEE_RATE = 0.03;

type DonationRow = {
  amount: number;
  tip_amount: number | null;
  paid_at: string | null;
  created_at?: string;
};
type PayoutRow = { amount: number; paid_at: string };

type PeriodStat = {
  label: string;
  bn: string;
  raised: number;
  tips: number;
  count: number;
};

// All time math lives outside the component (eslint react-hooks/purity).
function computePeriods(donations: DonationRow[]): PeriodStat[] {
  const now = Date.now();
  const windows: { label: string; bn: string; days: number | null }[] = [
    { label: "Today (24h)", bn: "আজ", days: 1 },
    { label: "This week (7d)", bn: "এই সপ্তাহ", days: 7 },
    { label: "This month (30d)", bn: "এই মাস", days: 30 },
    { label: "This quarter (90d)", bn: "এই কোয়ার্টার", days: 90 },
    { label: "This year (365d)", bn: "এই বছর", days: 365 },
    { label: "Lifetime", bn: "সর্বমোট", days: null },
  ];
  return windows.map((w) => {
    let raised = 0;
    let tips = 0;
    let count = 0;
    for (const d of donations) {
      const ts = +new Date(d.paid_at ?? d.created_at ?? 0);
      if (w.days !== null && now - ts > w.days * DAY_MS) continue;
      raised += Number(d.amount);
      tips += Number(d.tip_amount ?? 0);
      count += 1;
    }
    return { label: w.label, bn: w.bn, raised, tips, count };
  });
}

function inRange(
  iso: string | null | undefined,
  fromTs: number | null,
  toTs: number | null
): boolean {
  if (!iso) return false;
  const ts = +new Date(iso);
  if (fromTs !== null && ts < fromTs) return false;
  if (toTs !== null && ts >= toTs) return false;
  return true;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { from = "", to = "" } = await searchParams;
  const fromTs = from ? new Date(from).getTime() : null;
  const toTs = to ? new Date(to).getTime() + DAY_MS : null;

  const { data: donationRows } = await supabase
    .from("donations")
    .select("amount, tip_amount, paid_at, created_at")
    .eq("status", "paid")
    .limit(100000);
  const donations = (donationRows ?? []) as DonationRow[];

  // Payouts exist only after finance.sql has been run.
  const { data: payoutRows, error: payoutsError } = await supabase
    .from("payouts")
    .select("amount, paid_at")
    .limit(100000);
  const payouts = (payoutRows ?? []) as PayoutRow[];

  const periods = computePeriods(donations);

  const lifetimeRaised = periods[periods.length - 1].raised;
  const lifetimeTips = periods[periods.length - 1].tips;
  const estFees = Math.round(lifetimeRaised * FEE_RATE);
  const netOwed = lifetimeRaised - estFees;
  const totalPaidOut = payouts.reduce((s, p) => s + Number(p.amount), 0);
  const stillToPay = Math.max(0, netOwed - totalPaidOut);

  // Custom date range
  const hasRange = fromTs !== null || toTs !== null;
  const rangeDonations = donations.filter((d) =>
    inRange(d.paid_at ?? d.created_at, fromTs, toTs)
  );
  const rangeRaised = rangeDonations.reduce((s, d) => s + Number(d.amount), 0);
  const rangeTips = rangeDonations.reduce(
    (s, d) => s + Number(d.tip_amount ?? 0),
    0
  );
  const rangePaidOut = payouts
    .filter((p) => inRange(p.paid_at, fromTs, toTs))
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="opacity-60 hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-bold">
        💰 Finance · <span className="font-bengali">অর্থ</span>
      </h1>

      {payoutsError ? (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          ⚠️ Payout tracking isn&rsquo;t active yet — run{" "}
          <code className="rounded bg-foreground/10 px-1">
            supabase/finance.sql
          </code>{" "}
          in the Supabase SQL Editor. Donation totals below still work.
        </p>
      ) : null}

      {/* Raised by period */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">Amount raised · সংগ্রহ</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {periods.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-foreground/10 bg-card p-5"
            >
              <p className="text-xl font-bold text-brand">
                {formatTaka(p.raised)}
              </p>
              <p className="mt-1 text-sm opacity-60">
                {p.label} · <span className="font-bengali">{p.bn}</span>
              </p>
              <p className="mt-0.5 text-xs opacity-40">
                {p.count} donation{p.count === 1 ? "" : "s"} · tips{" "}
                {formatTaka(p.tips)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Payout position */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Payout position · পেআউট</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-foreground/10 bg-card p-5">
            <p className="text-xl font-bold">{formatTaka(netOwed)}</p>
            <p className="mt-1 text-sm opacity-60">
              Owed to campaigners (after ~3% fees)
            </p>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-card p-5">
            <p className="text-xl font-bold text-brand">
              {formatTaka(totalPaidOut)}
            </p>
            <p className="mt-1 text-sm opacity-60">Total paid out</p>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-card p-5">
            <p className="text-xl font-bold text-accent">
              {formatTaka(stillToPay)}
            </p>
            <p className="mt-1 text-sm opacity-60">Still to pay</p>
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-card p-5">
            <p className="text-xl font-bold text-brand">
              {formatTaka(lifetimeTips)}
            </p>
            <p className="mt-1 text-sm opacity-60">Tips received (lifetime)</p>
          </div>
        </div>
        <p className="mt-3 text-xs opacity-50">
          Record each payout on the campaign&rsquo;s review page — the totals
          here update automatically.
        </p>
      </section>

      {/* Custom date range */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Custom date range · নির্দিষ্ট সময়</h2>
        <form
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-foreground/10 bg-card p-4"
        >
          <div>
            <label className="block text-xs font-medium opacity-60" htmlFor="from">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="mt-1 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-60" htmlFor="to">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="mt-1 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Apply
          </button>
          {hasRange ? (
            <Link
              href="/admin/finance"
              className="text-sm font-medium opacity-60 hover:text-brand"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {hasRange ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <p className="text-xl font-bold text-brand">
                {formatTaka(rangeRaised)}
              </p>
              <p className="mt-1 text-sm opacity-60">Raised in range</p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <p className="text-xl font-bold text-brand">
                {formatTaka(rangeTips)}
              </p>
              <p className="mt-1 text-sm opacity-60">Tips in range</p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <p className="text-xl font-bold text-brand">
                {formatTaka(rangePaidOut)}
              </p>
              <p className="mt-1 text-sm opacity-60">Paid out in range</p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <p className="text-xl font-bold text-brand">
                {rangeDonations.length}
              </p>
              <p className="mt-1 text-sm opacity-60">Donations in range</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm opacity-60">
            Pick a from/to date to see raised, tips and payouts for exactly
            that period.
          </p>
        )}
      </section>
    </main>
  );
}
