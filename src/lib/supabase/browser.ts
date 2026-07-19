"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./config";

// A browser client that shares the logged-in session (via cookies), so
// authenticated actions like uploading a private document work under the
// user's own row-level-security permissions.
export function createBrowserSupabaseClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
