"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* ============================================================
   Sign-up by one-time code.

   No password at all: we email a short code, and typing it back
   proves the address and creates the account in one step. That suits
   people who fundraise from a phone — nothing to invent, nothing to
   forget, and no separate "confirm your email" round trip.

   The name and mobile number travel as user metadata and land in
   public.profiles via the on_auth_user_created trigger.
   ============================================================ */

export type SendCodeState =
  | { error?: string; sent?: { email: string; fullName: string; phone: string } }
  | undefined;

export type VerifyState = { error?: string } | undefined;

/* Bangladeshi mobile numbers, stored as 11 digits (01XXXXXXXXX) so the
   creator directory can match the same person across campaigns. */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const last11 = digits.slice(-11);
  return /^01\d{9}$/.test(last11) ? last11 : null;
}

// Not exported: a "use server" file may only export async functions.
function describeOtpError(
  status: number,
  message: string,
  what: "send" | "verify",
  code?: string
): string {
  // Until custom SMTP is switched on in Supabase, the built-in sender
  // only delivers to the project team's own addresses — everyone else
  // is refused outright. Say so rather than blaming their email.
  if (
    code === "email_address_not_authorized" ||
    /not authorized|not_authorized/i.test(message)
  ) {
    return "Sign-ups aren't open yet — our email sender is still being connected. Please try again later, or message us on Facebook and we'll set your account up by hand.";
  }
  if (status === 429 || /rate limit|too many/i.test(message)) {
    return "Too many codes requested. Please wait a few minutes before asking for another one.";
  }
  if (what === "verify" && /expired|invalid/i.test(message)) {
    return "That code is wrong or has expired. Check the latest email, or send a new code.";
  }
  if (status >= 500 || status === 0) {
    return "Our login service is temporarily unavailable — this is not a problem with your details. Please try again in a minute.";
  }
  return message || "Something went wrong. Please try again.";
}

export async function sendSignupCode(
  _prevState: SendCodeState,
  formData: FormData
): Promise<SendCodeState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Please enter your full name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  const phone = normalisePhone(phoneRaw);
  if (!phone) {
    return {
      error:
        "Please enter your mobile number as 11 digits, starting 01 — for example 01712345678.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Only applied when the account is created.
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    return {
      error: describeOtpError(
        error.status ?? 0,
        error.message ?? "",
        "send",
        error.code
      ),
    };
  }

  return { sent: { email, fullName, phone } };
}

export async function verifySignupCode(
  _prevState: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");

  // Supabase's Email OTP Length is a project setting (6-10), so the
  // length is never hard-coded here.
  if (token.length < 6 || token.length > 10) {
    return { error: "Please type the code from the email." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return {
      error: describeOtpError(
        error.status ?? 0,
        error.message ?? "",
        "verify",
        error.code
      ),
    };
  }

  redirect("/start");
}
