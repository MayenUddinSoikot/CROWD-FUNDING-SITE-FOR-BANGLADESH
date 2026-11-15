"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/admin";

export type AnnouncementState = { error?: string; saved?: boolean } | undefined;

const MAX_LIVE = 3;

export async function addAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Admins only." };

  const message = String(formData.get("message") ?? "").trim();
  const messageBn = String(formData.get("message_bn") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const tone = String(formData.get("tone") ?? "normal");
  const position = Number(formData.get("position")) || 0;

  if (!message) return { error: "Write the message first." };
  if (message.length > 120) {
    return { error: "Keep it under 120 characters so it fits on a phone." };
  }
  if (tone !== "normal" && tone !== "urgent") {
    return { error: "Pick a valid tone." };
  }
  if (linkUrl && !/^(https:\/\/|\/)\S*$/.test(linkUrl)) {
    return { error: "The link must start with https:// or /" };
  }

  const { count } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  if ((count ?? 0) >= MAX_LIVE) {
    return {
      error: `Only ${MAX_LIVE} messages show at once — hide one before adding another.`,
    };
  }

  const { error } = await supabase.from("announcements").insert({
    message,
    message_bn: messageBn || null,
    link_url: linkUrl || null,
    tone,
    position,
    published: true,
  });

  if (error) {
    console.error("Failed to add announcement:", error.message);
    return {
      error:
        error.code === "42P01"
          ? "Run supabase/announcements.sql in Supabase first."
          : "Could not save it. Please try again.",
    };
  }

  revalidatePath("/admin/announcements", "layout");
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function removeAnnouncement(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) console.error("Failed to remove announcement:", error.message);

  revalidatePath("/admin/announcements", "layout");
  revalidatePath("/", "layout");
}

export async function toggleAnnouncement(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("published") ?? "") === "true";
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("announcements")
    .update({ published: next })
    .eq("id", id);
  if (error) console.error("Failed to toggle announcement:", error.message);

  revalidatePath("/admin/announcements", "layout");
  revalidatePath("/", "layout");
}
