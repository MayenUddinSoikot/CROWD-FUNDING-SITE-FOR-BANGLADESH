import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { SiteHeader } from "@/components/SiteHeader";
import { formatTaka } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/types";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin dashboard — Shohay সহায়" };

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-2xl font-bold text-brand">{value}</p>
      <p className="mt-1 text-sm opacity-60">{label}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data: all } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, category, goal_amount, raised_amount, status, beneficiary_name, district, created_at"
    )
    .order("created_at", { ascending: false });

  const campaigns = (all ?? []) as Campaign[];
  const pending = campaigns.filter((c) => c.status === "pending");
  const live = campaigns.filter((c) => c.status === "approved");
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.raised_amount), 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
        <h1 className="mt-10 text-2xl font-bold">
          Admin dashboard ·{" "}
          <span className="font-bengali">অ্যাডমিন ড্যাশবোর্ড</span>
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Pending review" value={String(pending.length)} />
          <StatTile label="Live campaigns" value={String(live.length)} />
          <StatTile label="Total campaigns" value={String(campaigns.length)} />
          <StatTile label="Total raised" value={formatTaka(totalRaised)} />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold">
            Waiting for review · <span className="font-bengali">পর্যালোচনা</span>
          </h2>
          <p className="mt-1 text-sm opacity-60">
            Open each one to see the applicant&rsquo;s NID, contact, and payout
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

        <section className="mt-10">
          <h2 className="text-lg font-bold">All campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-4 text-sm opacity-60">No campaigns yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-card">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/${c.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-foreground/5"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="whitespace-nowrap opacity-60">
                      {formatTaka(c.raised_amount)} · {c.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
