"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseClient } from "@/lib/supabase/anon";

export type SetupState = { error?: string; done?: boolean } | undefined;

export const FOCUS_OPTIONS = [
  "Medical",
  "Education",
  "Disaster relief",
  "Community",
  "Creator / content",
  "Occasion fundraisers",
  "Animals",
  "Other",
] as const;

/** Is this username free? Checked as they type, the way Patreon does,
    so nobody fills in a whole form only to be told at the end. */
export async function checkUsername(
  raw: string
): Promise<{ ok: boolean; message: string }> {
  const username = raw.trim().toLowerCase();

  if (!username) return { ok: false, message: "" };
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return {
      ok: false,
      message: "3–30 characters: lowercase letters, numbers, - or _",
    };
  }

  try {
    const { data } = await getSupabaseClient()
      .from("public_creators")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    if (data) return { ok: false, message: "That one is taken" };
    return { ok: true, message: "Available" };
  } catch {
    // Can't tell right now — don't block them; the save will catch it.
    return { ok: true, message: "" };
  }
}

export async function saveSetup(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const focus = formData.getAll("focus").map((f) => String(f)).slice(0, 8);

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return {
      error: "Pick a page address of 3–30 characters: letters, numbers, - or _",
    };
  }
  if (displayName.length < 2) {
    return { error: "Enter the name people should see on your page." };
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

  const base = {
    username,
    display_name: displayName,
    page_published: true,
  };

  let { error } = await supabase
    .from("profiles")
    .update({
      ...base,
      focus: focus.length > 0 ? focus : null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
    })
    .eq("id", user.id);

  // focus / page_published / social_links each arrive with a later SQL
  // script — save the name and address rather than losing everything.
  if (error?.code === "42703") {
    ({ error } = await supabase
      .from("profiles")
      .update({ username, display_name: displayName })
      .eq("id", user.id));
  }

  if (error) {
    if (error.code === "23505") {
      return { error: "That page address was just taken. Try another." };
    }
    console.error("Failed to save setup:", error.message);
    return { error: "Could not save. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath(`/creator/${username}`);
  return { done: true };
}
