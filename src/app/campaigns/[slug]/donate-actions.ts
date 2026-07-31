"use server";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

export type DonationState =
  | { error?: string; pledged?: false }
  | { pledged: true; amount: number }
  | undefined;

export async function startDonation(
  _prevState: DonationState,
  formData: FormData
): Promise<DonationState> {
  if (!isSupabaseConfigured()) {
    return { error: "Donations are not available yet." };
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const amount = Number(formData.get("amount"));
  const tipRaw = Number(formData.get("tip_amount"));
  const tip = Number.isFinite(tipRaw) && tipRaw > 0 ? Math.round(tipRaw) : 0;
  const donorName = String(formData.get("donor_name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim().slice(0, 25);
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!campaignId) return { error: "Something went wrong. Please retry." };
  if (!amount || amount < 10) {
    return { error: "Please choose an amount of at least ৳10." };
  }
  if (!contact) {
    return { error: "Add a phone or email so we can send a thank-you." };
  }

  const isEmail = contact.includes("@");

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("donations").insert({
    campaign_id: campaignId,
    amount,
    tip_amount: tip,
    donor_name: donorName || null,
    donor_email: isEmail ? contact : null,
    donor_phone: isEmail ? null : contact,
    message: message || null,
    is_anonymous: isAnonymous,
    // DEMO: mark paid immediately so the donation + message + live counter
    // show while testing. When SSLCommerz is added, insert 'initiated' here
    // and let the verified payment callback set 'paid'.
    status: "paid",
    paid_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to record donation:", error.message);
    return { error: "Could not record the donation. Please try again." };
  }

  return { pledged: true, amount };
}
