"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/admin";

export async function approveCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("Approve failed:", error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  revalidatePath("/");
}

export async function rejectCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) console.error("Reject failed:", error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}
