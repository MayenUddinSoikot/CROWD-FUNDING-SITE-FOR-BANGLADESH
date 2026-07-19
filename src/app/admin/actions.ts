"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return supabase;
}

export async function approveCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await requireAdmin();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("Approve failed:", error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await requireAdmin();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) console.error("Reject failed:", error.message);
  revalidatePath("/admin");
}
