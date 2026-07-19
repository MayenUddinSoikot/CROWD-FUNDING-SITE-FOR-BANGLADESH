import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SiteHeader } from "@/components/SiteHeader";
import { formatTaka } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/types";
import type { Campaign } from "@/lib/types";
import { approveCampaign, rejectCampaign } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Shohay সহায়" };

export default async function AdminPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const { data: pending } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, summary, category, goal_amount, beneficiary_name, district, created_at, status"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const campaigns = (pending ?? []) as Campaign[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="mt-10 text-2xl font-bold">
          Review queue · <span className="font-bengali">পর্যালোচনা</span>
        </h1>
        <p className="mt-1 text-sm opacity-60">
          Verify the beneficiary and NID before approving. Approved campaigns
          go live immediately.
        </p>

        {campaigns.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
            Nothing waiting for review. 🎉
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {campaigns.map((campaign) => {
              const category =
                CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
              return (
                <li
                  key={campaign.id}
                  className="rounded-2xl border border-foreground/10 bg-card p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    {category.en} ·{" "}
                    <span className="font-bengali">{category.bn}</span>
                    {campaign.district ? (
                      <span className="opacity-70"> · {campaign.district}</span>
                    ) : null}
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold">
                    {campaign.title}
                  </h2>
                  {campaign.title_bn ? (
                    <p className="font-bengali text-sm opacity-70">
                      {campaign.title_bn}
                    </p>
                  ) : null}
                  {campaign.beneficiary_name ? (
                    <p className="mt-1 text-sm opacity-60">
                      Beneficiary: {campaign.beneficiary_name}
                    </p>
                  ) : null}
                  {campaign.summary ? (
                    <p className="mt-2 text-sm opacity-80">{campaign.summary}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-brand">
                    Goal: {formatTaka(campaign.goal_amount)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={approveCampaign}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                      >
                        Approve · অনুমোদন
                      </button>
                    </form>
                    <form action={rejectCampaign}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
                      >
                        Reject · বাতিল
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-sm opacity-50">
          <Link href="/account" className="hover:text-brand">
            ← My campaigns
          </Link>
        </p>
      </main>
    </>
  );
}
