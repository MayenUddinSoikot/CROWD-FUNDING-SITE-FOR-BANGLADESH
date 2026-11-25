"use server";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

export type JoinState =
  | { error?: string; joined?: { accessKey: string; amount: number } }
  | undefined;

export async function joinMembership(
  _prevState: JoinState,
  formData: FormData
): Promise<JoinState> {
  if (!isSupabaseConfigured()) {
    return { error: "Memberships aren't available yet." };
  }

  const username = String(formData.get("username") ?? "").trim();
  const tierId = String(formData.get("tier_id") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount")) || 0);
  const name = String(formData.get("supporter_name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "")
    .trim()
    .slice(0, 200);
  const isPublic = formData.get("is_public") !== "off";

  if (!username) return { error: "Something went wrong. Please retry." };
  if (!tierId && amount < 10) {
    return { error: "Please choose an amount of at least ৳10 a month." };
  }
  if (!contact) {
    return {
      error: "Please leave a phone number or email so they can reach you.",
    };
  }

  const isEmail = contact.includes("@");

  try {
    const { data, error } = await getSupabaseClient().rpc("join_membership", {
      creator_username: username,
      tier_id: tierId || null,
      amount: amount || null,
      supporter_name: name || null,
      supporter_email: isEmail ? contact : null,
      supporter_phone: isEmail ? null : contact,
      message: message || null,
      is_public: isPublic,
    });

    if (error) {
      console.error("Failed to join membership:", error.message);
      if (/creator not found/i.test(error.message)) {
        return { error: "That creator page no longer exists." };
      }
      if (/amount too small/i.test(error.message)) {
        return { error: "Please choose an amount of at least ৳10 a month." };
      }
      return { error: "Could not set up the membership. Please try again." };
    }

    const row = (data as { access_key: string }[] | null)?.[0];
    if (!row?.access_key) {
      return { error: "Could not set up the membership. Please try again." };
    }

    return { joined: { accessKey: row.access_key, amount } };
  } catch {
    return { error: "Could not set up the membership. Please try again." };
  }
}
