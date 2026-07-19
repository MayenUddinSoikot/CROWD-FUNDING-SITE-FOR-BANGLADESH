import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./config";

// A cookie-aware client for Server Components and Server Actions. This is
// the one that knows *who is signed in*, so RLS policies using auth.uid()
// (e.g. "creators can only edit their own campaigns") work correctly.
export async function createServerSupabaseClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written. proxy.ts refreshes the session on every request instead.
        }
      },
    },
  });
}
