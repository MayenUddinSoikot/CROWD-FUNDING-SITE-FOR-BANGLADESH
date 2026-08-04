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

// Freeze: hides the campaign from the public and holds its funds while
// the team investigates. Unfreeze puts it back live.
export async function freezeCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "frozen" })
    .eq("id", id);

  if (error) console.error("Freeze failed:", error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  revalidatePath("/");
}

// Record money actually sent to a campaigner (bKash/bank transfer done
// outside Shohay). Powers the finance dashboard's paid-out totals.
export async function recordPayout(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();
  const supabase = await getAdminClient();
  if (!supabase || !id || !Number.isFinite(amount) || amount <= 0) return;

  const { error } = await supabase.from("payouts").insert({
    campaign_id: id,
    amount,
    ...(note ? { note } : {}),
  });

  if (error) console.error("Payout record failed:", error.message);
  revalidatePath(`/admin/${id}`);
  revalidatePath("/admin/finance");
}

export async function unfreezeCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await getAdminClient();
  if (!supabase || !id) return;

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) console.error("Unfreeze failed:", error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  revalidatePath("/");
}
