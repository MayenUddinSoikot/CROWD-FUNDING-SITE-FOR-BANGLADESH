import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka, formatCampaignId } from "@/lib/format";
import {
  mergePeople,
  findPerson,
  type MergeCampaign,
  type MergeVerification,
  type MergeProfile,
} from "@/lib/creator-merge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaigner profile — Shohay সহায়" };

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

  const campaignFields =
    "id, creator_id, slug, title, raised_amount, status, created_at";
  let { data: campaignRows } = await supabase
    .from("campaigns")
    .select(`${campaignFields}, campaign_no`)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (!campaignRows) {
    const retry = await supabase
      .from("campaigns")
      .select(campaignFields)
      .order("created_at", { ascending: false })
      .limit(10000);
    campaignRows = (retry.data ?? []) as unknown as typeof campaignRows;
  }
  const campaigns = (campaignRows ?? []) as MergeCampaign[];

  const { data: verificationRows } = await supabase
    .from("campaign_verifications")
    .select(
      "campaign_id, applicant_name, applicant_email, applicant_phone, applicant_nid, bkash_number, bank_name, bank_account_number"
    )
    .limit(10000);
  const verifications = (verificationRows ?? []) as MergeVerification[];

  let { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, phone, display_name, username")
    .limit(10000);
  if (!profileRows) {
    const retry = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .limit(10000);
    profileRows = (retry.data ?? []) as unknown as typeof profileRows;
  }
  const profiles = (profileRows ?? []) as MergeProfile[];

  const people = mergePeople(campaigns, verifications, profiles);
  const person = findPerson(people, id);
  if (!person) notFound();

  const campaignIds = person.campaigns.map((c) => c.id);
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

  const name = person.names[0] ?? "Unnamed campaigner";
  const liveCount = person.campaigns.filter((c) => c.status === "approved").length;
  const memberSince = new Date(person.firstSeen).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin/creators" className="opacity-60 hover:text-brand">
          ← All campaigners
        </Link>
      </p>

      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xl font-bold text-brand">
          {name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {person.names.length > 1 ? (
            <p className="text-sm opacity-60">
              Also appears as: {person.names.slice(1).join(", ")}
            </p>
          ) : null}
          <p className="text-sm opacity-60">First campaign: {memberSince}</p>
          {person.accountIds.length > 1 ? (
            <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              ⚠ Uses {person.accountIds.length} login accounts (matched by
              shared email / phone / ID)
            </span>
          ) : null}
          {person.usernames.map((u) => (
            <p key={u}>
              <Link
                href={`/creator/${u}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Public profile: /creator/{u} →
              </Link>
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">
            {person.campaigns.length}
          </p>
          <p className="mt-0.5 text-xs opacity-60">Campaigns (lifetime)</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{liveCount}</p>
          <p className="mt-0.5 text-xs opacity-60">Live now</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">
            {formatTaka(person.totalRaised)}
          </p>
          <p className="mt-0.5 text-xs opacity-60">Total raised</p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-card p-4">
          <p className="text-xl font-bold text-brand">{formatTaka(paidOut)}</p>
          <p className="mt-0.5 text-xs opacity-60">Paid out to them</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-sm font-bold text-amber-700">
          🔒 Private — identity & contact (all details ever submitted)
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Names used</dt>
            <dd className="font-medium sm:text-right">
              {person.names.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Emails</dt>
            <dd className="font-medium sm:text-right">
              {person.emails.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Phones</dt>
            <dd className="font-medium sm:text-right">
              {person.phones.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">NID / Passport / Birth certificate</dt>
            <dd className="font-medium sm:text-right">
              {person.nids.join(", ") || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="opacity-60">Payout methods used</dt>
            <dd className="font-medium sm:text-right">
              {person.payoutMethods.join(" · ") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          All their campaigns ({person.campaigns.length})
        </h2>
        <ul className="mt-4 divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-card">
          {person.campaigns.map((c) => (
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
        </ul>
      </section>
    </main>
  );
}
