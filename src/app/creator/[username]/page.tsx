import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, PublicCreator } from "@/lib/types";
import { formatTaka } from "@/lib/format";
import { CampaignCard } from "@/components/CampaignCard";

// Always show the creator's live campaigns and totals.
export const dynamic = "force-dynamic";

async function getCreator(username: string): Promise<PublicCreator | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("public_creators")
      .select("id, username, display_name, bio, avatar_url")
      .eq("username", username)
      .maybeSingle();
    if (error) {
      console.error("Failed to load creator:", error.message);
      return null;
    }
    return data as PublicCreator | null;
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return null;
  }
}

async function getCreatorCampaigns(creatorId: string): Promise<Campaign[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "id, slug, title, title_bn, summary, category, goal_amount, raised_amount, status, cover_image_url, district, is_recurring, created_at"
      )
      .eq("creator_id", creatorId)
      .in("status", ["approved", "completed"])
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load creator campaigns:", error.message);
      return [];
    }
    return (data ?? []) as Campaign[];
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreator(username);
  if (!creator) return { title: "Creator not found — Shohay" };
  const name = creator.display_name ?? creator.username;
  return {
    title: `${name} — Shohay সহায়`,
    description: creator.bio ?? `Support ${name} on Shohay.`,
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await getCreator(username);
  if (!creator) notFound();

  const campaigns = await getCreatorCampaigns(creator.id);
  const name = creator.display_name ?? creator.username;
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <header className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        {creator.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatar_url}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-brand/20"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-3xl font-bold text-brand">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-3xl font-bold leading-tight">{name}</h1>
          <p className="mt-1 text-sm opacity-50">@{creator.username}</p>
          {creator.bio ? (
            <p className="mt-3 whitespace-pre-line leading-relaxed opacity-80">
              {creator.bio}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm sm:justify-start">
            <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
            </span>
            {totalRaised > 0 ? (
              <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
                {formatTaka(totalRaised)} raised
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold">
          Campaigns · <span className="font-bengali">ক্যাম্পেইন</span>
        </h2>

        {campaigns.length === 0 ? (
          <p className="mt-4 text-sm opacity-60">
            No live campaigns yet.{" "}
            <span className="font-bengali">এখনো কোনো ক্যাম্পেইন নেই।</span>
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
