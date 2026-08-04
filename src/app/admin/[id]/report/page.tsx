import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka, formatCampaignId } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Donation report — Shohay সহায়" };

type DonationRow = {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  amount: number;
  tip_amount: number | null;
  message: string | null;
  is_anonymous: boolean | null;
  paid_at: string | null;
  created_at: string;
};

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

export default async function DonationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { id } = await params;

  const reportFields =
    "id, slug, title, title_bn, goal_amount, raised_amount, status, beneficiary_name, district, created_at";
  let { data: campaign } = await supabase
    .from("campaigns")
    .select(`${reportFields}, campaign_no`)
    .eq("id", id)
    .maybeSingle();
  if (!campaign) {
    const retry = await supabase
      .from("campaigns")
      .select(reportFields)
      .eq("id", id)
      .maybeSingle();
    campaign = (retry.data ?? null) as unknown as typeof campaign;
  }
  if (!campaign) notFound();
  const c = campaign as Campaign;

  const { data: donationRows, error } = await supabase
    .from("donations")
    .select(
      "id, donor_name, donor_email, donor_phone, amount, tip_amount, message, is_anonymous, paid_at, created_at"
    )
    .eq("campaign_id", id)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  if (error) console.error("Failed to load donations:", error.message);
  const donations = (donationRows ?? []) as DonationRow[];

  const totalAmount = donations.reduce((s, d) => s + Number(d.amount), 0);
  const totalTips = donations.reduce((s, d) => s + Number(d.tip_amount ?? 0), 0);

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="print-area mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <p className="no-print mt-8 text-sm">
        <Link href={`/admin/${c.id}`} className="opacity-60 hover:text-brand">
          ← Back to review
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wide text-brand">
            সহায় SHOHAY — Donation report
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
            Status: {c.status} · Report generated {generatedAt}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{donations.length}</p>
          <p className="mt-0.5 text-xs opacity-60">Donations</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(totalAmount)}</p>
          <p className="mt-0.5 text-xs opacity-60">Total donated</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(totalTips)}</p>
          <p className="mt-0.5 text-xs opacity-60">Tips to Shohay</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(c.goal_amount)}</p>
          <p className="mt-0.5 text-xs opacity-60">Campaign goal</p>
        </div>
      </div>

      {donations.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
          No paid donations recorded for this campaign yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
                <th className="px-3 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Time</th>
                <th className="px-3 py-3 font-semibold">Donor</th>
                <th className="px-3 py-3 font-semibold">Contact / payment no.</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
                <th className="px-3 py-3 text-right font-semibold">Tip</th>
                <th className="px-3 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {donations.map((d, i) => (
                <tr key={d.id} className="align-top">
                  <td className="px-3 py-2.5 opacity-50">{i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatDate(d.paid_at ?? d.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 opacity-70">
                    {formatTime(d.paid_at ?? d.created_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium">
                      {d.donor_name ?? "Anonymous"}
                    </span>
                    {d.is_anonymous ? (
                      <span className="ml-1 text-xs opacity-50">
                        (hidden publicly)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 opacity-70">
                    {d.donor_phone ?? d.donor_email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-brand">
                    {formatTaka(Number(d.amount))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right opacity-70">
                    {Number(d.tip_amount ?? 0) > 0
                      ? formatTaka(Number(d.tip_amount))
                      : "—"}
                  </td>
                  <td className="max-w-[220px] px-3 py-2.5 text-xs leading-relaxed opacity-80">
                    {d.message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 font-bold">
                <td colSpan={5} className="px-3 py-3 text-right">
                  Total
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right text-brand">
                  {formatTaka(totalAmount)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  {formatTaka(totalTips)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed opacity-50">
        Private & confidential — for Shohay&rsquo;s internal verification team
        and independent auditors only. Payment transaction numbers will appear
        here automatically once SSLCommerz payments go live.
      </p>
    </main>
  );
}
