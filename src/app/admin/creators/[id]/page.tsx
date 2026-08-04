import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka, formatCampaignId } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creator profile — Shohay সহায়" };

type VerificationRow = {
  campaign_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_nid: string | null;
  bkash_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-brand/15 text-brand",
  rejected: "bg-accent/15 text-accent",
  completed: "bg-foreground/10 text-foreground",
  frozen: "bg-sky-500/15 text-sky-700",
  draft: "bg-foreground/10 text-foreground",
};

export default async function AdminCreatorProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { id } = await params;

  // display_name/username exist only after creator-profiles.sql.
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, display_name, username, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) {
    const retry = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .eq("id", id)
      .maybeSingle();
    profile = (retry.data ?? null) as unknown as typeof profile;
  }

  const campaignFields =
    "id, slug, title, title_bn, category, goal_amount, raised_amount, status, campaign_type, district, created_at";
  let { data: campaignRows } = await supabase
    .from("campaigns")
    .select(`${campaignFields}, campaign_no`)
    .eq("creator_id", id)
    .order("created_at", { ascending: false });
  if (!campaignRows) {
    const retry = await supabase
      .from("campaigns")
      .select(campaignFields)
      .eq("creator_id", id)
      .order("created_at", { ascending: false });
    campaignRows = (retry.data ?? []) as unknown as typeof campaignRows;
  }
  const campaigns = (campaignRows ?? []) as Campaign[];

  if (!profile && campaigns.length === 0) notFound();

  const campaignIds = campaigns.map((c) => c.id);
  const { data: verificationRows } = campaignIds.length
    ? await supabase
        .from("campaign_verifications")
        .select(
          "campaign_id, applicant_name, applicant_email, applicant_phone, applicant_nid, bkash_number, bank_name, bank_account_number"
        )
        .in("campaign_id", campaignIds)
    : { data: [] };
  const verifications = (verificationRows ?? []) as VerificationRow[];

  const { data: payoutRows } = campaignIds.length
    ? await supabase
        .from("payouts")
        .select("campaign_id, amount")
        .in("campaign_id", campaignIds)
    : { data: [] };
  const paidOut = ((payoutRows ?? []) as { amount: number }[]).reduce(
    (s, p) => s + Number(p.amount),
    0
  );

  const uniq = (values: (string | null)[]) =>
    [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))];

  const names = uniq([
    profile?.display_name ?? null,
    profile?.full_name ?? null,
    ...verifications.map((v) => v.applicant_name),
  ]);
  const emails = uniq(verifications.map((v) => v.applicant_email));
  const phones = uniq([
    profile?.phone ?? null,
    ...verifications.map((v) => v.applicant_phone),
  ]);
  const nids = uniq(verifications.map((v) => v.applicant_nid));
  const payoutMethods = uniq([
    ...verifications.map((v) =>
      v.bkash_number ? `bKash/Nagad ${v.bkash_number}` : null
    ),
    ...verifications.map((v) =>
      v.bank_name && v.bank_account_number
        ? `${v.bank_name} a/c ${v.bank_account_number}`
        : null
    ),
  ]);

  const name = names[0] ?? "Unnamed creator";
  const totalRaised = campaigns.reduce((s, c) => s + Number(c.raised_amount), 0);
  const liveCount = campaigns.filter((c) => c.status === "approved").length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin/creators" className="opacity-60 hover:text-brand">
          ← All creators
        </Link>
      </p>

      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xl font-bold text-brand">
          {name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {names.length > 1 ? (
            <p className="text-sm opacity-60">
              Also appears as: {names.slice(1).join(", ")}
            </p>
          ) : null}
          {profile?.username ? (
            <Link
              href={`/creator/${profile.username}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              Public profile: /creator/{profile.username} →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{campaigns.length}</p>
          <p className="mt-0.5 text-xs opacity-60">Campaigns (lifetime)</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{liveCount}</p>
          <p className="mt-0.5 text-xs opacity-60">Live now</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(totalRaised)}</p>
          <p className="mt-0.5 text-xs opacity-60">Total raised</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(paidOut)}</p>
          <p className="mt-0.5 text-xs opacity-60">Paid out to them</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-sm font-bold text-amber-700">
          🔒 Private — identity & contact
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Email</dt>
            <dd className="font-medium sm:text-right">
              {emails.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Phone</dt>
            <dd className="font-medium sm:text-right">
              {phones.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">NID / Passport / Birth certificate</dt>
            <dd className="font-medium sm:text-right">
              {nids.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Payout methods used</dt>
            <dd className="font-medium sm:text-right">
              {payoutMethods.join(" · ") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">All their campaigns</h2>
        <ul className="mt-4 divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-card">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-foreground/5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className="text-xs opacity-50">
                    {formatCampaignId(c.campaign_no) ?? ""}
                    {c.campaign_no ? " · " : ""}
                    {new Date(c.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-brand">
                    {formatTaka(c.raised_amount)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      STATUS_BADGE[c.status] ?? STATUS_BADGE.draft
                    }`}
                  >
                    {c.status}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {campaigns.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm opacity-60">
              No campaigns yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
