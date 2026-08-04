"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type UpdateState = { error?: string; posted?: boolean } | undefined;

export async function postUpdate(
  _prevState: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  if (!isSupabaseConfigured()) return { error: "Not available yet." };

  const campaignId = String(formData.get("campaign_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!campaignId || !body) {
    return { error: "Write something before posting." };
  }

  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const validUrl = (u: string) => /^https:\/\/\S+$/.test(u) && u.length <= 500;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // RLS lets only the campaign's creator (or an admin) insert here.
  // Media keys are only sent when present, so posting keeps working
  // even if campaigner-tools.sql hasn't been run yet.
  const { error } = await supabase.from("campaign_updates").insert({
    campaign_id: campaignId,
    body,
    ...(validUrl(imageUrl) ? { image_url: imageUrl } : {}),
    ...(validUrl(videoUrl) ? { video_url: videoUrl } : {}),
  });

  if (error) {
    console.error("Failed to post update:", error.message);
    return { error: "Could not post the update. Try again." };
  }

  if (slug) revalidatePath(`/campaigns/${slug}`);
  revalidatePath(`/account/campaigns/${campaignId}`);
  return { posted: true };
}
