import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Campaign, CampaignCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CampaignCard } from "@/components/CampaignCard";
import { SiteHeader } from "@/components/SiteHeader";

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

async function getCampaigns(
  category: CampaignCategory | null
): Promise<Campaign[] | null> {
  if (!isSupabaseConfigured()) return null;

  // Never crash the page on a bad connection — fall back to the
  // "database not connected" notice instead.
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("campaigns")
      .select(
        "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, district, ends_at, created_at"
      )
      .in("status", ["approved", "completed"])
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load campaigns:", error.message);
      return null;
    }
    return data as Campaign[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && category in CATEGORY_LABELS
      ? (category as CampaignCategory)
      : null;

  const campaigns = await getCampaigns(activeCategory);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-16 text-center">
        <section className="flex max-w-3xl flex-col items-center pb-10 pt-14">
          <h1 className="font-bengali text-4xl font-bold leading-tight sm:text-5xl">
            মানুষের পাশে দাঁড়ানোর সবচেয়ে সহজ জায়গা
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-80">
            Bangladesh&rsquo;s trusted home for help —{" "}
            <span className="font-semibold text-brand">0% platform fee</span>.
            Every taka goes straight to the campaign, via bKash, Nagad, and
            cards.
          </p>
          <p className="font-bengali mt-2 max-w-xl leading-relaxed opacity-80">
            প্রতিটি টাকা যায় সরাসরি ক্যাম্পেইনে — বিকাশ, নগদ ও কার্ডের মাধ্যমে।
          </p>
        </section>

        <section id="campaigns" className="w-full max-w-5xl">
          <h2 className="text-2xl font-bold">
            Live campaigns ·{" "}
            <span className="font-bengali">চলমান ক্যাম্পেইন</span>
          </h2>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/#campaigns"
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                activeCategory === null
                  ? "border-brand bg-brand text-white"
                  : "border-foreground/20 hover:border-brand hover:text-brand"
              }`}
            >
              All · <span className="font-bengali">সব</span>
            </Link>
            {(
              Object.entries(CATEGORY_LABELS) as [
                CampaignCategory,
                (typeof CATEGORY_LABELS)[CampaignCategory],
              ][]
            ).map(([key, label]) => (
              <Link
                key={key}
                href={`/?category=${key}#campaigns`}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  activeCategory === key
                    ? "border-brand bg-brand text-white"
                    : "border-foreground/20 hover:border-brand hover:text-brand"
                }`}
              >
                <span className="font-bengali">{label.bn}</span> · {label.en}
              </Link>
            ))}
          </div>

          {campaigns === null ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-foreground/10 bg-card p-8 text-sm opacity-70">
              The database is not connected yet. Add the Supabase environment
              variables in Vercel and redeploy.
            </div>
          ) : campaigns.length === 0 ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-foreground/10 bg-card p-8 text-sm opacity-70">
              No campaigns in this category yet.
              <span className="font-bengali block pt-1">
                এই ক্যাটাগরিতে এখনো কোনো ক্যাম্পেইন নেই।
              </span>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 text-sm opacity-50">
          © {new Date().getFullYear()} Shohay · 0% platform fee · Made in
          Bangladesh 🇧🇩
        </footer>
      </main>
    </>
  );
}
