import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creators — Shohay সহায়" };

type CampaignRow = {
  id: string;
  creator_id: string | null;
  title: string;
  raised_amount: number;
  status: string;
  created_at: string;
};
type VerificationRow = {
  campaign_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_nid: string | null;
};
type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  display_name?: string | null;
  username?: string | null;
};

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { q = "" } = await searchParams;
  const needle = q.trim().toLowerCase();

  const { data: campaignRows } = await supabase
    .from("campaigns")
    .select("id, creator_id, title, raised_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  const campaigns = (campaignRows ?? []) as CampaignRow[];

  const { data: verificationRows } = await supabase
    .from("campaign_verifications")
    .select(
      "campaign_id, applicant_name, applicant_email, applicant_phone, applicant_nid"
    )
    .limit(10000);
  const verifications = (verificationRows ?? []) as VerificationRow[];
  const verificationByCampaign = new Map(
    verifications.map((v) => [v.campaign_id, v])
  );

  // display_name/username exist only after creator-profiles.sql.
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
  const profileById = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  // Group everything by creator.
  type CreatorEntry = {
    id: string;
    name: string;
    emails: Set<string>;
    phones: Set<string>;
    nids: Set<string>;
    campaignCount: number;
    totalRaised: number;
    firstSeen: string;
  };
  const creators = new Map<string, CreatorEntry>();

  for (const c of campaigns) {
    if (!c.creator_id) continue;
    const v = verificationByCampaign.get(c.id);
    const p = profileById.get(c.creator_id);
    let entry = creators.get(c.creator_id);
    if (!entry) {
      entry = {
        id: c.creator_id,
        name:
          p?.display_name ??
          p?.full_name ??
          v?.applicant_name ??
          "Unnamed creator",
        emails: new Set(),
        phones: new Set(),
        nids: new Set(),
        campaignCount: 0,
        totalRaised: 0,
        firstSeen: c.created_at,
      };
      creators.set(c.creator_id, entry);
    }
    entry.campaignCount += 1;
    entry.totalRaised += Number(c.raised_amount);
    if (c.created_at < entry.firstSeen) entry.firstSeen = c.created_at;
    if (v?.applicant_name && entry.name === "Unnamed creator") {
      entry.name = v.applicant_name;
    }
    if (v?.applicant_email) entry.emails.add(v.applicant_email);
    if (v?.applicant_phone) entry.phones.add(v.applicant_phone);
    if (p?.phone) entry.phones.add(p.phone);
    if (v?.applicant_nid) entry.nids.add(v.applicant_nid);
  }

  let list = [...creators.values()].sort((a, b) => b.totalRaised - a.totalRaised);
  if (needle) {
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        [...e.emails].some((x) => x.toLowerCase().includes(needle)) ||
        [...e.phones].some((x) => x.includes(needle)) ||
        [...e.nids].some((x) => x.includes(needle))
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="opacity-60 hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-bold">
        👥 Campaign creators · <span className="font-bengali">ক্যাম্পেইনার</span>
      </h1>
      <p className="mt-1 text-sm opacity-60">
        Every person who has created a campaign, with their verified details
        and lifetime totals. One creator can run many campaigns.
      </p>

      <form method="get" className="mt-5">
        <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-card px-4 py-1.5 focus-within:border-brand">
          <span className="opacity-50">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone, or ID number…"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Search
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm opacity-60">
        {list.length} creator{list.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
              <th className="px-4 py-3 font-semibold">Creator</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">NID / Passport / BC</th>
              <th className="px-4 py-3 text-right font-semibold">Campaigns</th>
              <th className="px-4 py-3 text-right font-semibold">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {list.map((e) => (
              <tr key={e.id} className="align-top transition hover:bg-foreground/5">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/creators/${e.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {e.name}
                  </Link>
                </td>
                <td className="px-4 py-3 opacity-70">
                  {[...e.emails].join(", ") || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 opacity-70">
                  {[...e.phones].join(", ") || "—"}
                </td>
                <td className="px-4 py-3 opacity-70">
                  {[...e.nids].join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right">{e.campaignCount}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-brand">
                  {formatTaka(e.totalRaised)}
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center opacity-60">
                  No creators found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
