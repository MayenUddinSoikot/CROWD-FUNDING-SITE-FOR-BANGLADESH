import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My campaigns — Shohay সহায়" };

const STATUS_LABEL: Record<Campaign["status"], { en: string; className: string }> = {
  draft: { en: "Draft", className: "bg-foreground/10 text-foreground" },
  pending: { en: "Pending review", className: "bg-amber-500/15 text-amber-700" },
  approved: { en: "Live", className: "bg-brand/15 text-brand" },
  rejected: { en: "Needs changes", className: "bg-accent/15 text-accent" },
  completed: { en: "Completed", className: "bg-foreground/10 text-foreground" },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { created } = await searchParams;

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, category, goal_amount, raised_amount, status, district, created_at"
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load your campaigns:", error.message);
  const campaigns = (data ?? []) as Campaign[];

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="mt-10 text-2xl font-bold">
          My campaigns · <span className="font-bengali">আমার ক্যাম্পেইন</span>
        </h1>

        {created ? (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-brand">
            Submitted! Your campaign is pending review — it will appear
            publicly once approved.
          </div>
        ) : null}

        {campaigns.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
            You haven&rsquo;t started a campaign yet.
            <div className="mt-4">
              <Link
                href="/start"
                className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Start a campaign
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {campaigns.map((campaign) => {
              const status = STATUS_LABEL[campaign.status];
              const isPublic =
                campaign.status === "approved" || campaign.status === "completed";
              const content = (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 bg-card p-4">
                  <div>
                    <p className="font-semibold">{campaign.title}</p>
                    {campaign.title_bn ? (
                      <p className="font-bengali text-sm opacity-70">
                        {campaign.title_bn}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm opacity-60">
                      {formatTaka(campaign.raised_amount)} of{" "}
                      {formatTaka(campaign.goal_amount)}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.en}
                  </span>
                </div>
              );

              return (
                <li key={campaign.id}>
                  {isPublic ? (
                    <Link href={`/campaigns/${campaign.slug}`}>{content}</Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
