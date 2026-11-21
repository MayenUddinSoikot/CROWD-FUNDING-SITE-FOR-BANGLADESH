import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* The "or tap here instead" link in the login email lands here.

   The email gives people two ways in: type the 6-digit code, or tap the
   link. The link carries a hashed version of the same code, which this
   route exchanges for a session before sending them on.

   Note the link points straight at shohay.org — it does not bounce
   through Supabase — so nothing has to be added to Supabase's redirect
   allow-list for it to work. */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only ever send people to a path on this site, never to an address
  // somebody put in the query string.
  const nextParam = searchParams.get("next") ?? "/start";
  const next = nextParam.startsWith("/") ? nextParam : "/start";

  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?link=expired", request.url));
}
