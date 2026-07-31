import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, CampaignCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { RealtimeCampaignGrid } from "@/components/RealtimeCampaignGrid";

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
      <main className="flex flex-1 flex-col items-center pb-16 text-center">
        {/* Hero */}
        <section className="w-full bg-gradient-to-b from-brand/10 to-transparent px-6 py-16 sm:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <span className="rounded-full border border-brand/30 bg-card px-4 py-1 text-xs font-semibold text-brand">
              0% platform fee · every taka reaches the campaign
            </span>
            <h1 className="font-bengali mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              মানুষের পাশে দাঁড়ানোর সবচেয়ে সহজ জায়গা
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-80">
              Bangladesh&rsquo;s trusted home for help. Raise or donate for
              medical care, education, and disaster relief — via bKash, Nagad,
              and cards.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/start"
                className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
              >
                Start a campaign · <span className="font-bengali">শুরু করুন</span>
              </Link>
              <Link
                href="#campaigns"
                className="rounded-full border border-foreground/20 bg-card px-6 py-3 font-semibold transition hover:border-brand hover:text-brand"
              >
                Browse campaigns · <span className="font-bengali">দেখুন</span>
              </Link>
            </div>
          </div>
        </section>

        <section id="campaigns" className="mt-4 w-full max-w-5xl px-6">
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
            <RealtimeCampaignGrid
              key={activeCategory ?? "all"}
              initialCampaigns={campaigns}
              activeCategory={activeCategory}
            />
          )}
        </section>

        {/* Trust band */}
        <section className="mt-20 w-full bg-brand-dark px-6 py-16 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="rounded-full bg-white/15 px-4 py-1 text-sm font-semibold">
              We&rsquo;ve got you covered · <span className="font-bengali">আপনার পাশে</span>
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              Bangladesh&rsquo;s trusted place to give
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/85">
              Every campaign is personally verified with NID and documents
              before it goes live. With a 0% platform fee and secure bKash,
              Nagad &amp; card payments, you can give with peace of mind.
            </p>
            <div className="mt-8 grid w-full grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-sm text-white/75">platform fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-white/75">verified campaigns</p>
              </div>
              <div>
                <p className="text-2xl font-bold">🔒</p>
                <p className="text-sm text-white/75">secure payments</p>
              </div>
            </div>
            <Link
              href="/start"
              className="mt-8 rounded-full bg-white px-6 py-3 font-semibold text-brand-dark transition hover:bg-white/90"
            >
              Start a campaign
            </Link>
          </div>
        </section>

        <section id="how" className="mt-20 w-full max-w-5xl px-6">
          <h2 className="text-2xl font-bold">
            How Shohay works ·{" "}
            <span className="font-bengali">কীভাবে কাজ করে</span>
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                emoji: "✅",
                en: "Every campaign verified",
                bn: "প্রতিটি ক্যাম্পেইন যাচাই করা হয়",
                desc: "We check the beneficiary and NID before a campaign goes live.",
              },
              {
                emoji: "💚",
                en: "0% platform fee",
                bn: "কোনো প্ল্যাটফর্ম ফি নেই",
                desc: "Every taka you give goes straight to the campaign. We take nothing.",
              },
              {
                emoji: "🤝",
                en: "Direct, transparent payout",
                bn: "সরাসরি ও স্বচ্ছ পেআউট",
                desc: "Funds reach the beneficiary directly via bKash, Nagad, or bank.",
              },
            ].map((item) => (
              <div
                key={item.en}
                className="rounded-2xl border border-foreground/10 bg-card p-6 text-left"
              >
                <div className="text-3xl">{item.emoji}</div>
                <h3 className="mt-3 font-serif text-lg font-semibold">
                  {item.en}
                </h3>
                <p className="font-bengali mt-1 text-sm text-brand">
                  {item.bn}
                </p>
                <p className="mt-2 text-sm opacity-70">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
