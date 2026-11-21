"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export type SendCodeState = { error?: string; sentTo?: string } | undefined;
export type VerifyState = { error?: string } | undefined;

/* ============================================================
   Two ways in.

   1. A one-time code emailed to you — the normal way, and the only way
      for anyone who signed up through /signup, since those accounts
      have no password.
   2. Email + password, for accounts that were given one.
   ============================================================ */

export async function sendLoginCode(
  _prevState: SendCodeState,
  formData: FormData
): Promise<SendCodeState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Logging in must never quietly create a new account.
    options: { shouldCreateUser: false },
  });

  if (error) {
    const status = error.status ?? 0;
    const message = error.message ?? "";

    if (/signups not allowed|not found|no user/i.test(message)) {
      return {
        error:
          "We couldn't find an account with that email. Please check the spelling, or create a free account.",
      };
    }
    if (status === 429 || /rate limit|too many/i.test(message)) {
      return {
        error:
          "Too many codes requested. Please wait a few minutes before asking for another one.",
      };
    }
    if (status >= 500 || status === 0) {
      return {
        error:
          "Our login service is temporarily unavailable — this is not a problem with your email. Please try again in a minute.",
      };
    }
    return { error: message || "Could not send the code. Please try again." };
  }

  return { sentTo: email };
}

export async function verifyLoginCode(
  _prevState: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");

  if (token.length !== 6) {
    return { error: "Please type the 6-digit code from the email." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    const status = error.status ?? 0;
    const message = error.message ?? "";
    if (/expired|invalid/i.test(message)) {
      return {
        error:
          "That code is wrong or has expired. Check the latest email, or send a new code.",
      };
    }
    if (status >= 500 || status === 0) {
      return {
        error:
          "Our login service is temporarily unavailable. Please try again in a minute.",
      };
    }
    return { error: message || "Could not check that code. Please try again." };
  }

  redirect("/start");
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect("/start");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
