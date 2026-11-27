import {
  netOf,
  platformFee,
  CREATOR_FEE_PCT,
  BANK_FEE_PCT,
} from "@/lib/fees";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka, formatCampaignId } from "@/lib/format";
import type { Campaign, PublicDonation } from "@/lib/types";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaign report — Shohay সহায়" };



function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CampaignerReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const reportFields =
    "id, slug, title, title_bn, goal_amount, raised_amount, status, beneficiary_name, district, is_recurring, ends_at, created_at, creator_id, campaign_type";
  let { data } = await supabase
    .from("campaigns")
    .select(`${reportFields}, campaign_no`)
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (!data) {
    const retry = await supabase
      .from("campaigns")
      .select(reportFields)
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    data = (retry.data ?? null) as unknown as typeof data;
  }
  if (!data) notFound();
  const c = data as Campaign;

  const { data: donationRows } = await supabase
    .from("public_donations")
    .select("id, campaign_id, donor_name, amount, message, paid_at")
    .eq("campaign_id", id)
    .order("paid_at", { ascending: false });
  const donations = (donationRows ?? []) as PublicDonation[];

  const gross = donations.reduce((s, d) => s + Number(d.amount), 0);
  const shohayShare = platformFee(gross, c.campaign_type);
  const fee = gross - shohayShare - netOf(gross, c.campaign_type);
  const net = netOf(gross, c.campaign_type);

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="print-area mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
      <p className="no-print mt-8 text-sm">
        <Link
          href={`/account/campaigns/${c.id}`}
          className="opacity-60 hover:text-brand"
        >
          ← Manage campaign
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wide text-brand">
            সহায় SHOHAY — Campaign report
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold">{c.title}</h1>
          {c.title_bn ? (
            <p className="font-bengali opacity-80">{c.title_bn}</p>
          ) : null}
          <p className="mt-1 text-sm opacity-60">
            {formatCampaignId(c.campaign_no)
              ? `Campaign ID ${formatCampaignId(c.campaign_no)} · `
              : ""}
            {c.beneficiary_name ? `For ${c.beneficiary_name} · ` : ""}
            {c.district ? `${c.district} · ` : ""}
            Report generated {generatedAt}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Money summary: Shohay's share where it applies, then the bank's */}
      <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <h2 className="text-sm font-bold text-brand">
          Collection summary · অর্থ সংগ্রহ
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="opacity-70">
              Total collected ({donations.length} donation
              {donations.length === 1 ? "" : "s"})
            </dt>
            <dd className="font-semibold">{formatTaka(gross)}</dd>
          </div>
          {shohayShare > 0 ? (
            <div className="flex justify-between">
              <dt className="opacity-70">
                Shohay — creator page ({CREATOR_FEE_PCT}%)
              </dt>
              <dd className="font-semibold text-accent">
                − {formatTaka(shohayShare)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="opacity-70">
              Bank &amp; payment processing fee (~{BANK_FEE_PCT}%)
            </dt>
            <dd className="font-semibold text-accent">− {formatTaka(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-foreground/15 pt-2 text-base">
            <dt className="font-bold">
              Your payout · <span className="font-bengali">আপনার প্রাপ্য</span>
            </dt>
            <dd className="font-bold text-brand">{formatTaka(net)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed opacity-60">
          {shohayShare > 0
            ? `Shohay's share of a creator page is ${CREATOR_FEE_PCT}% — ${formatTaka(shohayShare)} here. The rest covers bKash/card/bank processing charges.`
            : `Shohay charges 0% platform fee. The ~${BANK_FEE_PCT}% covers bKash/card/bank processing charges only.`}{" "}
          {c.is_recurring
            ? "Payouts are sent within 3 days after each 30-day cycle ends."
            : "Your payout is sent within 3 days after the campaign ends."}
        </p>
      </div>

      {donations.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
          No donations recorded yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
                <th className="px-3 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Time</th>
                <th className="px-3 py-3 font-semibold">Donor</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {donations.map((d, i) => (
                <tr key={d.id} className="align-top">
                  <td className="px-3 py-2.5 opacity-50">{i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatDate(d.paid_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 opacity-70">
                    {formatTime(d.paid_at)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {d.donor_name ?? "Anonymous"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-brand">
                    {formatTaka(Number(d.amount))}
                  </td>
                  <td className="max-w-[240px] px-3 py-2.5 text-xs leading-relaxed opacity-80">
                    {d.message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 font-bold">
                <td colSpan={4} className="px-3 py-3 text-right">
                  Total
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right text-brand">
                  {formatTaka(gross)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed opacity-50">
        Generated by Shohay for the campaign organizer. Amounts shown are
        donations to your campaign; the final payout equals the total minus
        the deductions listed above.
      </p>
    </main>
  );
}
