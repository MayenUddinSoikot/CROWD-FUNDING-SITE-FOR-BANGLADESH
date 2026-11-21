"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignupState =
  | {
      error?: string;
      /* Set when the account was made but Supabase is configured to
         require an email confirmation first — there is no session yet,
         so the form shows "check your inbox" instead of logging in. */
      confirmEmail?: string;
    }
  | undefined;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shohay.org";

/* Bangladeshi mobile numbers, stored as 11 digits (01XXXXXXXXX) so the
   creator directory can match the same person across campaigns. */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const last11 = digits.slice(-11);
  return /^01\d{9}$/.test(last11) ? last11 : null;
}

export async function signUp(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (fullName.length < 2) {
    return { error: "Please enter your full name." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const phone = normalisePhone(phoneRaw);
  if (!phone) {
    return {
      error:
        "Please enter your mobile number as 11 digits, starting 01 — for example 01712345678.",
    };
  }
  if (password.length < 8) {
    return { error: "Your password needs to be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match. Please type them again." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the on_auth_user_created trigger, which copies both into
      // public.profiles.
      data: { full_name: fullName, phone },
      emailRedirectTo: `${SITE_URL}/login?confirmed=1`,
    },
  });

  if (error) {
    const status = error.status ?? 0;
    const message = error.message ?? "";

    if (
      error.code === "user_already_exists" ||
      /already registered|already been registered/i.test(message)
    ) {
      return {
        error:
          "An account already uses this email. Please log in instead, or reset your password if you've forgotten it.",
      };
    }
    if (status === 429) {
      return {
        error:
          "Too many sign-up attempts from here. Please wait a few minutes and try again.",
      };
    }
    if (/password/i.test(message)) {
      return { error: `Please choose a stronger password: ${message}` };
    }
    if (status >= 500 || status === 0) {
      return {
        error:
          "Our login service is temporarily unavailable — this is not a problem with your details. Please try again in a minute.",
      };
    }
    return { error: `Could not create the account: ${message}` };
  }

  // Supabase hides whether an email is already taken by returning a user
  // with no identities rather than an error. Say so plainly — a founder
  // stuck on "nothing happened" is worse than this.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      error:
        "An account already uses this email. Please log in instead, or reset your password if you've forgotten it.",
    };
  }

  // Email confirmation is on: no session until they click the link.
  if (!data.session) {
    return { confirmEmail: email };
  }

  redirect("/start");
}
