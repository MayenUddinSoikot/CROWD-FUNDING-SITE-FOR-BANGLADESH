"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";

export type CharityState = { error?: string; added?: boolean } | undefined;

export async function addCharity(
  _prev: CharityState,
  formData: FormData
): Promise<CharityState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Charity name is required." };

  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  const { error } = await supabase.from("charities").insert({
    name,
    description: val("description"),
    logo_url: val("logo_url"),
    bkash_number: val("bkash_number"),
    bank_name: val("bank_name"),
    bank_account_name: val("bank_account_name"),
    bank_account_number: val("bank_account_number"),
    bank_branch: val("bank_branch"),
    is_verified: true,
  });

  if (error) {
    console.error("Failed to add charity:", error.message);
    return { error: "Could not add the charity. Try again." };
  }

  revalidatePath("/admin/charities");
  return { added: true };
}

export async function updateCharity(
  _prev: CharityState,
  formData: FormData
): Promise<CharityState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "Charity name is required." };

  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  const { error } = await supabase
    .from("charities")
    .update({
      name,
      description: val("description"),
      logo_url: val("logo_url"),
      bkash_number: val("bkash_number"),
      bank_name: val("bank_name"),
      bank_account_name: val("bank_account_name"),
      bank_account_number: val("bank_account_number"),
      bank_branch: val("bank_branch"),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update charity:", error.message);
    return { error: "Could not save changes. Try again." };
  }

  revalidatePath("/admin/charities");
  revalidatePath(`/admin/charities/${id}`);
  return { added: true };
}

export async function deleteCharity(formData: FormData) {
  const supabase = await getAdminClient();
  if (!supabase) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("charities").delete().eq("id", id);
  if (error) console.error("Failed to delete charity:", error.message);
  revalidatePath("/admin/charities");
  redirect("/admin/charities");
}
