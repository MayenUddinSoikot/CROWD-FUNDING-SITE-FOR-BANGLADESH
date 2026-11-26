"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/admin";

export type MediaState = { error?: string; saved?: boolean } | undefined;

const SLOTS = new Set(["hero", "faces", "featured"]);
const TYPES = new Set(["image", "video", "youtube"]);

export async function addSiteMedia(
  _prev: MediaState,
  formData: FormData
): Promise<MediaState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Admins only." };

  const slot = String(formData.get("slot") ?? "featured");
  const mediaType = String(formData.get("media_type") ?? "image");
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  let position = Number(formData.get("position")) || 0;

  /* Put a new slide after the ones already there, rather than letting
     everything pile up on 0 where the order stops being predictable. */
  if (position === 0) {
    const { data: last } = await supabase
      .from("site_media")
      .select("position")
      .eq("slot", slot)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = ((last?.position as number | undefined) ?? 0) + 1;
  }

  if (!SLOTS.has(slot) || !TYPES.has(mediaType)) {
    return { error: "Pick a valid place and media type." };
  }
  if (!/^https:\/\/\S+$/.test(url)) {
    return { error: "The media link must be a full https:// address." };
  }
  if (linkUrl && !/^(https:\/\/|\/)\S*$/.test(linkUrl)) {
    return { error: "The button link must start with https:// or /" };
  }

  /* Heroes used to replace each other — adding one retired the last.
     The homepage hero is a carousel now, so every published hero row is
     a slide and they rotate in "position" order. Retiring one is done
     with its own Hide button. */

  const { error } = await supabase.from("site_media").insert({
    slot,
    media_type: mediaType,
    url,
    title: title || null,
    subtitle: subtitle || null,
    link_url: linkUrl || null,
    position,
    published: true,
  });

  if (error) {
    console.error("Failed to add site media:", error.message);
    return {
      error:
        error.code === "42P01"
          ? "Run supabase/site-media.sql in Supabase first."
          : "Could not save it. Please try again.",
    };
  }

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { saved: true };
}

export async function removeSiteMedia(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase.from("site_media").delete().eq("id", id);
  if (error) console.error("Failed to remove site media:", error.message);

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function toggleSiteMedia(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("published") ?? "") === "true";
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("site_media")
    .update({ published: next })
    .eq("id", id);
  if (error) console.error("Failed to toggle site media:", error.message);

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

/* Change the words on a slide that is already on the homepage.

   Adding a slide always let you set a headline; there was no way to
   change one afterwards. So every slide added without a headline fell
   back to the homepage's default line, and three different videos all
   carried the same sentence with no way to tell them apart. */
export async function updateSiteMedia(
  _prev: MediaState,
  formData: FormData
): Promise<MediaState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Admins only." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Which one?" };

  const title = String(formData.get("title") ?? "").trim();
  const titleBn = String(formData.get("title_bn") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const position = Number(formData.get("position"));

  if (linkUrl && !/^(https:\/\/|\/)\S*$/.test(linkUrl)) {
    return { error: "The link must start with https:// or /" };
  }

  const patch: Record<string, unknown> = {
    title: title || null,
    subtitle: subtitle || null,
    link_url: linkUrl || null,
  };
  if (Number.isFinite(position)) patch.position = position;

  /* A replacement picture, if one was chosen. Left out of the patch
     when empty so saving the words alone never wipes the image. */
  const url = String(formData.get("url") ?? "").trim();
  if (url) {
    if (!/^https:\/\/\S+$/.test(url)) {
      return { error: "The media link must be a full https:// address." };
    }
    patch.url = url;
    const mediaType = String(formData.get("media_type") ?? "").trim();
    if (mediaType) patch.media_type = mediaType;
  }

  let { error } = await supabase
    .from("site_media")
    .update({ ...patch, title_bn: titleBn || null })
    .eq("id", id);

  // title_bn arrives with a later SQL file — save the rest regardless.
  if (error?.code === "42703") {
    ({ error } = await supabase.from("site_media").update(patch).eq("id", id));
  }

  if (error) {
    console.error("Failed to update site media:", error.message);
    return { error: "Could not save that. Please try again." };
  }

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { saved: true };
}
