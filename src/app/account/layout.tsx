import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AccountNav } from "./AccountNav";

/* The shell every dashboard screen sits in: a banner when the page
   isn't live yet, the navigation rail, and the content beside it.

   Doing it here rather than on each page means the rail never
   disappears mid-task, which is the whole point of it. */

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // page_published arrives with a later SQL script.
  const { data } = await supabase
    .from("profiles")
    .select("username, page_published")
    .eq("id", user.id)
    .maybeSingle();

  const username = (data?.username as string | null) ?? null;
  const published = data?.page_published !== false;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 sm:px-6">
      {/* The equivalent of Patreon's "verify your email before you can
          launch" strip: one thing standing between them and a live
          page, said once, at the top. */}
      {!username ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warn-tint px-5 py-4">
          <p className="text-sm font-medium text-warn-ink">
            Your page isn&rsquo;t set up yet — it takes about a minute.
          </p>
          <Link
            href="/setup"
            className="press shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white no-underline hover:bg-brand-dark"
          >
            Set up my page
          </Link>
        </div>
      ) : !published ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warn-tint px-5 py-4">
          <p className="text-sm font-medium text-warn-ink">
            Your page is finished but not published, so nobody can find it
            yet.
          </p>
          <Link
            href="/account/my-page"
            className="press shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white no-underline hover:bg-brand-dark"
          >
            Publish it
          </Link>
        </div>
      ) : null}

      <div className="mt-6 lg:flex lg:gap-10">
        <AccountNav username={username} />
        <div className="min-w-0 flex-1 pt-4 lg:pt-0">{children}</div>
      </div>
    </main>
  );
}
