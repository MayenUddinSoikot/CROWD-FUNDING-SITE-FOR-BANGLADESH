import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/types";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin dashboard — Shohay সহায়" };

const STATUS_BADGE: Record<Campaign["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-foreground/10 text-foreground" },
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-700" },
  approved: { label: "Live", className: "bg-brand/15 text-brand" },
  rejected: { label: "Refused", className: "bg-accent/15 text-accent" },
  completed: { label: "Ended", className: "bg-foreground/10 text-foreground" },
  frozen: { label: "Frozen", className: "bg-sky-500/15 text-sky-700" },
};

function StatTile({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: string;
  tone?: "brand" | "amber" | "red" | "sky" | "neutral";
}) {
  const toneClass = {
    brand: "text-brand",
    amber: "text-amber-600",
    red: "text-accent",
    sky: "text-sky-600",
    neutral: "text-foreground",
  }[tone];
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm opacity-60">{label}</p>
    </div>
  );
}

function daysUntil(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default async function AdminDashboard() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data: all } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, category, goal_amount, raised_amount, status, beneficiary_name, district, ends_at, is_recurring, created_at"
    )
    .order("created_at", { ascending: false });

  const campaigns = (all ?? []) as Campaign[];
  const pending = campaigns.filter((c) => c.status === "pending");
  const live = campaigns.filter((c) => c.status === "approved");
  const endingSoon = live.filter((c) => {
    if (c.is_recurring) return false;
    const d = daysUntil(c.ends_at);
    return d !== null && d >= 0 && d <= 7;
  });
  const ended = campaigns.filter(
    (c) =>
      c.status === "completed" ||
      (c.status === "approved" && !c.is_recurring && (daysUntil(c.ends_at) ?? 1) < 0)
  );
  const refused = campaigns.filter((c) => c.status === "rejected");
  const frozen = campaigns.filter((c) => c.status === "frozen");
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.raised_amount), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Admin dashboard · <span className="font-bengali">অ্যাডমিন</span>
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/charities"
            className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            Charities
          </Link>
          <Link
            href="/admin/news"
            className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            News
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Pending review" value={String(pending.length)} tone="amber" />
        <StatTile label="Live now" value={String(live.length)} />
        <StatTile label="Ending soon (7 days)" value={String(endingSoon.length)} tone="amber" />
        <StatTile label="Ended" value={String(ended.length)} tone="neutral" />
        <StatTile label="Refused" value={String(refused.length)} tone="red" />
        <StatTile label="Frozen" value={String(frozen.length)} tone="sky" />
        <StatTile label="Total campaigns" value={String(campaigns.length)} tone="neutral" />
        <StatTile label="Total raised" value={formatTaka(totalRaised)} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">
          Waiting for review · <span className="font-bengali">পর্যালোচনা</span>
        </h2>
        <p className="mt-1 text-sm opacity-60">
          Open each one to see the applicant&rsquo;s ID, contact, and payout
          details before approving.
        </p>

        {pending.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
            Nothing waiting for review. 🎉
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/${c.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 bg-card p-4 transition hover:border-brand/50"
                >
                  <div>
                    <p className="font-serif font-semibold">{c.title}</p>
                    <p className="mt-0.5 text-xs opacity-60">
                      {(CATEGORY_LABELS[c.category] ?? CATEGORY_LABELS.other).en}
                      {c.district ? ` · ${c.district}` : ""} · goal{" "}
                      {formatTaka(c.goal_amount)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700">
                    Review →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {endingSoon.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">⏳ Ending within 7 days</h2>
          <ul className="mt-4 divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-card">
            {endingSoon.map((c) => {
              const d = daysUntil(c.ends_at);
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/${c.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-foreground/5"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="whitespace-nowrap text-xs font-semibold text-amber-700">
                      {d === 0 ? "ends today" : `${d} day${d === 1 ? "" : "s"} left`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {frozen.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">🧊 Frozen — under investigation</h2>
          <ul className="mt-4 divide-y divide-foreground/10 rounded-2xl border border-sky-500/30 bg-card">
            {frozen.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/${c.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-foreground/5"
                >
                  <span className="truncate">{c.title}</span>
                  <span className="whitespace-nowrap opacity-60">
                    {formatTaka(c.raised_amount)} held
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-bold">All campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="mt-4 text-sm opacity-60">No campaigns yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-xs uppercase tracking-wide opacity-60">
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Raised / goal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {campaigns.map((c) => {
                  const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft;
                  return (
                    <tr key={c.id} className="transition hover:bg-foreground/5">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/${c.id}`}
                          className="font-medium hover:text-brand"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 opacity-70">
                        {(CATEGORY_LABELS[c.category] ?? CATEGORY_LABELS.other).en}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-semibold text-brand">
                          {formatTaka(c.raised_amount)}
                        </span>{" "}
                        <span className="opacity-50">
                          / {formatTaka(c.goal_amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs opacity-60">
                        {new Date(c.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
