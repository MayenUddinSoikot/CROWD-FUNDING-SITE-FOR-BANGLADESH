import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

/* Monthly memberships.

   Supporters have no Shohay account, so a membership carries its own
   secret access_key and that key is how they get back to the
   members-only posts. Nothing charges anyone yet — until bKash
   auto-debit exists a membership is a pledge with a due date. */

export type MembershipTier = {
  id: string;
  creator_id: string;
  name: string;
  name_bn: string | null;
  amount: number;
  perks: string | null;
  position: number;
};

export type PublicSupporter = {
  creator_id: string;
  supporter_name: string;
  tier_name: string | null;
  message: string | null;
  started_at: string;
};

export type CreatorPost = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  members_only?: boolean;
  created_at: string;
};

/** Every table here arrives with a later SQL script, so each read
    returns empty rather than taking the page down with it. */
export async function getTiers(creatorId: string): Promise<MembershipTier[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getSupabaseClient()
      .from("public_membership_tiers")
      .select("id, creator_id, name, name_bn, amount, perks, position")
      .eq("creator_id", creatorId)
      .order("position", { ascending: true })
      .order("amount", { ascending: true });
    if (error) return [];
    return (data ?? []) as MembershipTier[];
  } catch {
    return [];
  }
}

export async function getSupporters(
  creatorId: string,
  limit = 24
): Promise<PublicSupporter[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getSupabaseClient()
      .from("public_supporters")
      .select("creator_id, supporter_name, tier_name, message, started_at")
      .eq("creator_id", creatorId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as PublicSupporter[];
  } catch {
    return [];
  }
}

export async function getPublicPosts(
  creatorId: string,
  limit = 10
): Promise<CreatorPost[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await getSupabaseClient()
      .from("public_creator_posts")
      .select("id, title, body, image_url, video_url, created_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as CreatorPost[];
  } catch {
    return [];
  }
}
