import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* Where Google (and any other social login) sends people back to.

   Supabase hands back a one-time `code`; swapping it for a session is
   what actually logs the person in. The matching verifier was put in a
   cookie when the sign-in started, which is why this has to run on the
   server and not in the page. */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Only ever send people to a path on this site.
  const nextParam = searchParams.get("next") ?? "/start";
  const next = nextParam.startsWith("/") ? nextParam : "/start";

  // Google's own refusals arrive as an error on the query string —
  // usually because the person pressed Cancel.
  const denied = searchParams.get("error");
  if (denied) {
    return NextResponse.redirect(new URL("/login?social=cancelled", request.url));
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error("Social login failed:", error.message);
  }

  return NextResponse.redirect(new URL("/login?social=failed", request.url));
}
