import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";

export async function SiteHeader() {
  let isLoggedIn = false;
  let isAdmin = false;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      isAdmin = Boolean(profile?.is_admin);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-bengali text-2xl font-bold text-brand">
            সহায়
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] opacity-60 sm:inline">
            Shohay
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <form action="/search" className="hidden flex-1 md:block">
          <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-card px-4 py-1.5 focus-within:border-brand">
            <span className="opacity-50">🔍</span>
            <input
              name="q"
              placeholder="Search fundraisers, creators, causes…"
              className="w-full bg-transparent py-1 text-sm outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Search
            </button>
          </div>
        </form>

        <div className="ml-auto">
          <SiteNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
