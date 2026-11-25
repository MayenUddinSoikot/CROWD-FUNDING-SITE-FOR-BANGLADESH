"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function setPagePublished(published: boolean): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .update({ page_published: published })
    .eq("id", user.id)
    .select("username")
    .maybeSingle();

  if (error) {
    console.error("Failed to change publish state:", error.message);
    return false;
  }

  revalidatePath("/account/my-page");
  revalidatePath("/creators");
  if (data?.username) revalidatePath(`/creator/${data.username}`);
  return true;
}
