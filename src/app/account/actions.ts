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
  const coverUrl = String(formData.get("cover_url") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (username && !/^[a-z0-9_-]{3,30}$/.test(username)) {
    return {
      error:
        "Username must be 3–30 characters: lowercase letters, numbers, - or _.",
    };
  }
  if (avatarUrl && !/^https:\/\/\S+$/.test(avatarUrl)) {
    return { error: "Avatar link must start with https://" };
  }
  if (coverUrl && !/^https:\/\/\S+$/.test(coverUrl)) {
    return { error: "Cover image link must start with https://" };
  }

  // Stored as 11 digits (01XXXXXXXXX) so the creator directory can match
  // the same person across campaigns.
  let phone: string | null = null;
  if (phoneRaw) {
    const digits = phoneRaw.replace(/\D/g, "").slice(-11);
    if (!/^01\d{9}$/.test(digits)) {
      return {
        error:
          "Please enter your mobile as 11 digits starting 01 — for example 01712345678.",
      };
    }
    phone = digits;
  }

  const socialLinks: Record<string, string> = {};
  for (const key of ["facebook", "instagram", "youtube", "tiktok"]) {
    const value = String(formData.get(`social_${key}`) ?? "").trim();
    if (!value) continue;
    if (!/^https:\/\/\S+$/.test(value) || value.length > 300) {
      return { error: `Your ${key} link must be a full https:// address.` };
    }
    socialLinks[key] = value;
  }

  /* What they raise for. Capped the same way the setup wizard caps it,
     and stored as null rather than an empty array so "not chosen yet"
     and "chosen nothing" do not look different to the page. */
  const focus = formData
    .getAll("focus")
    .map((f) => String(f).trim())
    .filter(Boolean)
    .slice(0, 8);

  const base = {
    username: username || null,
    display_name: displayName || null,
    bio: bio || null,
    avatar_url: avatarUrl || null,
    cover_url: coverUrl || null,
    full_name: fullName || null,
    phone,
  };

  let { error } = await supabase
    .from("profiles")
    .update({
      ...base,
      focus: focus.length > 0 ? focus : null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
    })
    .eq("id", user.id);

  // focus / social_links each arrive with a later SQL file — if this
  // database has not had them yet, save everything else rather than
  // failing the whole form.
  if (error?.code === "42703") {
    ({ error } = await supabase
      .from("profiles")
      .update(base)
      .eq("id", user.id));
  }

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
