import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";
import {
  mergePeople,
  type MergeCampaign,
  type MergeVerification,
  type MergeProfile,
} from "@/lib/creator-merge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaigners — Shohay সহায়" };

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
  const campaigns = (campaignRows ?? []) as MergeCampaign[];

  const { data: verificationRows } = await supabase
    .from("campaign_verifications")
    .select(
      "campaign_id, applicant_name, applicant_email, applicant_phone, applicant_nid"
    )
    .limit(10000);
  const verifications = (verificationRows ?? []) as MergeVerification[];

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
  const profiles = ((profileRows ?? []) as MergeProfile[]);

  let people = mergePeople(campaigns, verifications, profiles);

  if (needle) {
    people = people.filter(
      (e) =>
        e.names.some((x) => x.toLowerCase().includes(needle)) ||
        e.emails.some((x) => x.toLowerCase().includes(needle)) ||
        e.phones.some((x) => x.includes(needle)) ||
        e.nids.some((x) => x.toLowerCase().includes(needle))
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
        👥 Campaigners · <span className="font-bengali">ক্যাম্পেইনার</span>
      </h1>
      <p className="mt-1 text-sm opacity-60">
        One profile per person — everyone who has ever created any campaign
        (fundraiser, birthday, creator). If the same email, phone, or ID
        number is used again — even from a new account — it lands in the same
        profile automatically.
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
        {people.length} campaigner{people.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
              <th className="px-4 py-3 font-semibold">Person</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">NID / Passport / BC</th>
              <th className="px-4 py-3 text-right font-semibold">Campaigns</th>
              <th className="px-4 py-3 text-right font-semibold">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {people.map((e) => (
              <tr key={e.key} className="align-top transition hover:bg-foreground/5">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/creators/${e.key}`}
                    className="font-medium hover:text-brand"
                  >
                    {e.names[0] ?? "Unnamed"}
                  </Link>
                  {e.names.length > 1 ? (
                    <p className="text-xs opacity-50">
                      also: {e.names.slice(1).join(", ")}
                    </p>
                  ) : null}
                  {e.accountIds.length > 1 ? (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      ⚠ {e.accountIds.length} accounts
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 opacity-70">
                  {e.emails.join(", ") || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 opacity-70">
                  {e.phones.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 opacity-70">
                  {e.nids.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right">{e.campaigns.length}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-brand">
                  {formatTaka(e.totalRaised)}
                </td>
              </tr>
            ))}
            {people.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center opacity-60">
                  No campaigners found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
