import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { cleanUsername } from "@/lib/referral";
import { CARD_SIZES, renderShareCard, type CardFormat } from "@/lib/share-card";

/* A ready-made post for a campaign.

   /campaigns/<slug>/share-card?format=story&via=rafsan */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams, origin } = new URL(request.url);

  const requested = searchParams.get("format") ?? "story";
  const format: CardFormat = (
    requested in CARD_SIZES ? requested : "story"
  ) as CardFormat;
  const via = cleanUsername(searchParams.get("via"));

  if (!isSupabaseConfigured()) {
    return new Response("Not available", { status: 503 });
  }

  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("campaigns")
    .select(
      "title, goal_amount, raised_amount, cover_image_url, district, campaign_type"
    )
    .eq("slug", slug)
    .in("status", ["approved", "completed"])
    .maybeSingle();

  if (!data) return new Response("Not found", { status: 404 });

  const campaign = data as {
    title: string;
    goal_amount: number;
    raised_amount: number;
    cover_image_url: string | null;
    district: string | null;
    campaign_type: string | null;
  };

  // A cover that isn't really an image (an early campaign has a Google
  // search URL saved as its photo) would fail the whole render, so only
  // same-origin Supabase storage URLs are drawn.
  const cover =
    campaign.cover_image_url &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\//i.test(
      campaign.cover_image_url
    )
      ? campaign.cover_image_url
      : null;

  try {
    return await renderShareCard({
      format,
      title: campaign.title,
      district: campaign.district,
      raised: Number(campaign.raised_amount) || 0,
      goal: Number(campaign.goal_amount) || 0,
      coverImageUrl: cover,
      shareUrl: `${origin}/campaigns/${slug}${via ? `?via=${via}` : ""}`,
      via,
      campaignType: campaign.campaign_type,
    });
  } catch (err) {
    console.error("Share card failed to render:", err);
    return new Response("Could not draw the card", { status: 500 });
  }
}
