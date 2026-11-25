"use server";

import { cookies } from "next/headers";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { REFERRAL_COOKIE, cleanUsername } from "@/lib/referral";

/* Who gets the credit for bringing this donor in.

   Resolved through public_creators, so only a real, published creator
   page can be credited — a made-up ?via= in the URL earns nobody
   anything. Never fails the donation: an unknown username just means
   the gift goes uncredited. */
async function resolveReferrer(): Promise<{
  referrer_id: string;
  referrer_username: string;
} | null> {
  try {
    const store = await cookies();
    const username = cleanUsername(store.get(REFERRAL_COOKIE)?.value);
    if (!username) return null;

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("public_creators")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (!data?.id) return null;
    return { referrer_id: data.id as string, referrer_username: username };
  } catch {
    return null;
  }
}

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
  const message = String(formData.get("message") ?? "").trim().slice(0, 200);
  const isAnonymous = formData.get("is_anonymous") === "on";
  // Supporter asked for this to repeat every month. Recorded now;
  // real recurring billing starts with SSLCommerz.
  const isMonthly = formData.get("is_monthly") === "on";

  if (!campaignId) return { error: "Something went wrong. Please retry." };
  if (!amount || amount < 10) {
    return { error: "Please choose an amount of at least ৳10." };
  }

  const isEmail = contact.includes("@");

  const referrer = await resolveReferrer();

  const supabase = getSupabaseClient();
  const row = {
    campaign_id: campaignId,
    amount,
    tip_amount: tip,
    donor_name: donorName || null,
    donor_email: contact && isEmail ? contact : null,
    donor_phone: contact && !isEmail ? contact : null,
    message: message || null,
    is_anonymous: isAnonymous,
    // Only sent when ticked, so donations keep working before
    // creator-page.sql has been run.
    ...(isMonthly ? { is_monthly: true } : {}),
    // DEMO: mark paid immediately so the donation + message + live counter
    // show while testing. When SSLCommerz is added, insert 'initiated' here
    // and let the verified payment callback set 'paid'.
    status: "paid",
    paid_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("donations")
    .insert(referrer ? { ...row, ...referrer } : row);

  // referrals.sql not run yet — record the donation without the credit
  // rather than losing it.
  if (error && referrer && /referrer_/.test(error.message)) {
    ({ error } = await supabase.from("donations").insert(row));
  }

  if (error) {
    console.error("Failed to record donation:", error.message);
    return { error: "Could not record the donation. Please try again." };
  }

  return { pledged: true, amount };
}
