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
    <header className="relative border-b border-foreground/10 bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-bengali text-2xl font-bold text-brand">
            সহায়
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
            Shohay
          </span>
        </Link>
        <SiteNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
