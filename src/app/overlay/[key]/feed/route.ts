import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

/* The JSON the overlay polls.

   Proxied through our own domain rather than letting the overlay page
   talk to Supabase directly, so the page stays a single dependency-free
   file and no key has to be embedded in it. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Donation = {
  id: string;
  donor: string;
  amount: number;
  message: string | null;
  campaign_title: string;
  paid_at: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const since = new URL(request.url).searchParams.get("since");

  const empty = {
    donations: [] as Donation[],
    raised_today: 0,
    raised_total: 0,
    supporters_today: 0,
  };
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });

  if (!isSupabaseConfigured() || !key || key.length < 24) return json(empty);

  try {
    const supabase = getSupabaseClient();
    const [feed, totals] = await Promise.all([
      supabase.rpc("overlay_feed", { overlay_key: key, since: since || null }),
      supabase.rpc("overlay_totals", { overlay_key: key }),
    ]);

    const t = (totals.data?.[0] ?? {}) as {
      raised_today?: number;
      raised_total?: number;
      supporters_today?: number;
    };

    return json({
      donations: (feed.data ?? []) as Donation[],
      raised_today: Number(t.raised_today ?? 0),
      raised_total: Number(t.raised_total ?? 0),
      supporters_today: Number(t.supporters_today ?? 0),
    });
  } catch {
    // A stream must never show an error. Silence is the right failure.
    return json(empty);
  }
}
