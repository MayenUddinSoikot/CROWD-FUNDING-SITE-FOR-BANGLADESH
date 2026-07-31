"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/admin";
import { slugify } from "@/lib/slug";

export type PostState = { error?: string; created?: boolean } | undefined;

export async function createPost(
  _prev: PostState,
  formData: FormData
): Promise<PostState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  const { error } = await supabase.from("posts").insert({
    slug: slugify(title),
    title,
    title_bn: val("title_bn"),
    excerpt: val("excerpt"),
    body: val("body"),
    body_bn: val("body_bn"),
    cover_image_url: val("cover_image_url"),
    published: formData.get("published") === "on",
  });

  if (error) {
    console.error("Failed to create post:", error.message);
    return { error: "Could not save the post. Try again." };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { created: true };
}

export async function togglePublish(formData: FormData) {
  const supabase = await getAdminClient();
  if (!supabase) return;
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "true";
  if (!id) return;

  const { error } = await supabase
    .from("posts")
    .update({ published: publish })
    .eq("id", id);
  if (error) console.error("Failed to toggle publish:", error.message);
  revalidatePath("/admin/news");
  revalidatePath("/news");
}

export async function deletePost(formData: FormData) {
  const supabase = await getAdminClient();
  if (!supabase) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) console.error("Failed to delete post:", error.message);
  revalidatePath("/admin/news");
  revalidatePath("/news");
}
