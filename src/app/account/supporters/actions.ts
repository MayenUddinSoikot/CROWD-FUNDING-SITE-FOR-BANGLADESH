"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type FormState = { error?: string; done?: string } | undefined;

async function me() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addTier(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, user } = await me();
  if (!user) return { error: "Please log in again." };

  const name = String(formData.get("name") ?? "").trim();
  const nameBn = String(formData.get("name_bn") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount")) || 0);
  const perks = String(formData.get("perks") ?? "").trim().slice(0, 500);

  if (name.length < 2) return { error: "Give the tier a name." };
  if (amount < 10) return { error: "The monthly amount must be at least ৳10." };

  const { error } = await supabase.from("membership_tiers").insert({
    creator_id: user.id,
    name,
    name_bn: nameBn || null,
    amount,
    perks: perks || null,
    position: amount,
  });

  if (error) {
    console.error("Failed to add tier:", error.message);
    return {
      error:
        "Could not save that tier. If this keeps happening, the memberships update may not have been applied yet.",
    };
  }

  revalidatePath("/account/supporters");
  return { done: `Added the ${name} tier.` };
}

export async function removeTier(formData: FormData): Promise<void> {
  const { supabase, user } = await me();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Retiring rather than deleting: people are already on it, and their
  // membership still points at it.
  await supabase
    .from("membership_tiers")
    .update({ active: false })
    .eq("id", id)
    .eq("creator_id", user.id);

  revalidatePath("/account/supporters");
}

export async function addPost(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, user } = await me();
  if (!user) return { error: "Please log in again." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const membersOnly = formData.get("members_only") === "on";

  if (title.length < 2) return { error: "Give the post a title." };

  const { error } = await supabase.from("creator_posts").insert({
    creator_id: user.id,
    title,
    body: body || null,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    members_only: membersOnly,
  });

  if (error) {
    console.error("Failed to add post:", error.message);
    return { error: "Could not save that post. Please try again." };
  }

  revalidatePath("/account/supporters");
  return {
    done: membersOnly
      ? "Posted for your supporters only."
      : "Posted on your creator page.",
  };
}

export async function removePost(formData: FormData): Promise<void> {
  const { supabase, user } = await me();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("creator_posts")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  revalidatePath("/account/supporters");
}
