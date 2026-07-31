"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; saved?: boolean } | undefined;

export async function saveCreatorProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  if (username && !/^[a-z0-9_-]{3,30}$/.test(username)) {
    return {
      error:
        "Username must be 3–30 characters: lowercase letters, numbers, - or _.",
    };
  }
  if (avatarUrl && !/^https:\/\/\S+$/.test(avatarUrl)) {
    return { error: "Avatar link must start with https://" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken. Try another." };
    }
    console.error("Failed to save profile:", error.message);
    return { error: "Could not save your profile. Try again." };
  }

  revalidatePath("/account");
  if (username) revalidatePath(`/creator/${username}`);
  return { saved: true };
}
