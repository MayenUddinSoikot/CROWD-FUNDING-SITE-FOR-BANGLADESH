import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./config";

export { isSupabaseConfigured } from "./config";

// A plain client with no cookie/session awareness. Safe to use for public
// reads in Server Components and for Realtime subscriptions in the browser
// — neither needs the signed-in user's session, only the public anon key.
export function getSupabaseClient() {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey);
}
