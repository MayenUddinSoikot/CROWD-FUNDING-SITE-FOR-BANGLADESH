"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* "Continue with Google".

   Started on the server so the PKCE verifier lands in a cookie that
   /auth/callback can read when Google sends the person back. */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shohay.org";

export async function signInWithGoogle(): Promise<void> {
  let destination: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
        queryParams: {
          // Always show the account chooser. People share phones here,
          // and silently reusing the last Google account is a real way
          // to end up posting from somebody else's name.
          prompt: "select_account",
        },
      },
    });
    if (!error && data?.url) destination = data.url;
    else if (error) console.error("Google sign-in failed:", error.message);
  } catch (err) {
    console.error("Google sign-in threw:", err);
  }

  // redirect() throws, so it must happen outside the try block.
  redirect(destination ?? "/login?social=unavailable");
}
