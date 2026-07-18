import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Campaign } from "@/lib/types";
import { CampaignCard } from "@/components/CampaignCard";
import { SiteHeader } from "@/components/SiteHeader";

// Always show fresh donation totals — never a stale build-time snapshot.
export const dynamic = "force-dynamic";

async function getCampaigns(): Promise<Campaign[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, district, ends_at, created_at"
    )
    .in("status", ["approved", "completed"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load campaigns:", error.message);
    return [];
  }
  return data as Campaign[];
}

export default async function Home() {
  const campaigns = await getCampaigns();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pb-16 text-center">
        <section className="flex flex-col items-center pb-12 pt-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-brand">Shohay</span>{" "}
            <span className="font-bengali">সহায়</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-80">
            Support verified campaigns for medical care, education, and
            disaster relief — with bKash, Nagad, and cards.
          </p>
          <p className="font-bengali mt-2 max-w-xl leading-relaxed opacity-80">
            যাচাইকৃত ক্যাম্পেইনে পাশে দাঁড়ান — বিকাশ, নগদ ও কার্ডের মাধ্যমে।
          </p>
        </section>

        <section id="campaigns" className="w-full max-w-5xl">
          <h2 className="text-2xl font-bold">
            Live campaigns ·{" "}
            <span className="font-bengali">চলমান ক্যাম্পেইন</span>
          </h2>

          {campaigns === null ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-foreground/10 p-8 text-sm opacity-70">
              The database is not connected yet. Add the Supabase environment
              variables in Vercel and redeploy.
            </div>
          ) : campaigns.length === 0 ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-foreground/10 p-8 text-sm opacity-70">
              No campaigns yet — check back soon.
              <span className="font-bengali block pt-1">
                এখনো কোনো ক্যাম্পেইন নেই — শীঘ্রই আসছে।
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
          © {new Date().getFullYear()} Shohay · Made in Bangladesh 🇧🇩
        </footer>
      </main>
    </>
  );
}
