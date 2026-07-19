import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export async function SiteHeader() {
  let isLoggedIn = false;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  return (
    <header className="border-b border-foreground/10 bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-bengali text-2xl font-bold text-brand">
            সহায়
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
            Shohay
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#campaigns" className="hover:text-brand">
            Campaigns · <span className="font-bengali">ক্যাম্পেইন</span>
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/account" className="hover:text-brand">
                My campaigns
              </Link>
              <form action={logout}>
                <button type="submit" className="hover:text-brand">
                  Log out
                </button>
              </form>
            </>
          ) : null}

          <Link
            href="/start"
            className="rounded-full bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
          >
            Start a campaign
          </Link>
        </nav>
      </div>
    </header>
  );
}
