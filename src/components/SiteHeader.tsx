import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseClient } from "@/lib/supabase/anon";
import type { Announcement } from "@/lib/types";
import { SiteNav } from "@/components/SiteNav";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { HeaderShell } from "@/components/HeaderShell";

// Silently empty until announcements.sql has been run, or until an
// admin publishes a line.
async function getAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id, message, message_bn, link_url, tone, position, published")
      .eq("published", true)
      .order("position", { ascending: true })
      .limit(5);
    if (error) return [];
    return (data ?? []) as Announcement[];
  } catch {
    return [];
  }
}

export async function SiteHeader() {
  let isLoggedIn = false;
  let isAdmin = false;

  const announcements = await getAnnouncements();

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
    <>
      <AnnouncementBar items={announcements} />
      {/* NEVER put backdrop-blur (or any backdrop-filter, transform or
          filter) on this header. It creates a containing block, which traps
          the mobile menu's position:fixed panel inside the header — the menu
          then renders as loose buttons over the page with no background.
          Keep the background solid. */}
      <HeaderShell>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-6">
        <Link
          href="/"
          className="press flex shrink-0 items-baseline gap-2"
          aria-label="Shohay — home"
        >
          <span className="logo-mark font-bengali text-2xl font-bold text-brand">
            সহায়
          </span>
          <span className="logo-sub hidden text-[11px] font-bold uppercase tracking-[0.22em] sm:inline">
            Shohay
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <form action="/campaigns" className="hidden flex-1 md:block">
          <label htmlFor="site-search" className="sr-only">
            Search campaigns
          </label>
          <div className="search-shell flex items-center gap-2 rounded-full border border-foreground/10 bg-card px-4 py-1.5 focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(17,105,74,0.12)]">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="shrink-0 text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search campaigns, creators, or ID"
              className="w-full bg-transparent py-1.5 text-sm outline-none"
            />
            <button
              type="submit"
              className="press min-h-[36px] shrink-0 rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Search
            </button>
          </div>
        </form>

        <div className="ml-auto">
          <SiteNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
        </div>
        </div>
      </HeaderShell>
    </>
  );
}
