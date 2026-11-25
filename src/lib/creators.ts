import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { CreatorCardData } from "@/components/CreatorCard";

/* Everyone with a published creator page.

   Returns empty rather than throwing when the creator-page scripts
   haven't been run, so the homepage never breaks over a missing
   column. */
export async function getCreators(limit = 12): Promise<CreatorCardData[]> {
  if (!isSupabaseConfigured()) return [];

  const base = "id, username, display_name, bio, avatar_url";
  try {
    const supabase = getSupabaseClient();

    // The fallback selects fewer columns, so the two results have
    // different shapes — hold them as the shared card type instead.
    const first = await supabase
      .from("public_creators")
      .select(`${base}, cover_url, focus`)
      .limit(limit);

    let rows = first.data as CreatorCardData[] | null;
    if (first.error) {
      const retry = await supabase
        .from("public_creators")
        .select(base)
        .limit(limit);
      if (retry.error) return [];
      rows = retry.data as unknown as CreatorCardData[] | null;
    }
    if (!rows) return [];

    const creators = rows;
    if (creators.length === 0) return [];

    // Supporter counts, in one query rather than one per creator.
    try {
      const { data: supporterRows } = await supabase
        .from("public_supporters")
        .select("creator_id");
      const counts = new Map<string, number>();
      for (const row of (supporterRows ?? []) as { creator_id: string }[]) {
        counts.set(row.creator_id, (counts.get(row.creator_id) ?? 0) + 1);
      }
      for (const c of creators) c.supporters = counts.get(c.id) ?? 0;
    } catch {
      /* counts are decoration; the cards work without them */
    }

    // Busiest pages first, so the directory doesn't open on empty ones.
    return creators.sort((a, b) => (b.supporters ?? 0) - (a.supporters ?? 0));
  } catch {
    return [];
  }
}
