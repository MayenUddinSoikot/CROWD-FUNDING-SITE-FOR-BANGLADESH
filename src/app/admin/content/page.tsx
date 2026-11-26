import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { SectionCard } from "../homepage/ContentEditor";
import { SITE_GROUPS } from "@/lib/homepage-fields";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Words & settings — Shohay সহায়" };

export default async function SiteContentPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data, error } = await supabase
    .from("site_content")
    .select("key, value");

  const saved: Record<string, string> = {};
  for (const row of data ?? []) {
    const r = row as { key: string; value: string | null };
    if (typeof r.value === "string") saved[r.key] = r.value;
  }
  const missingTable = error?.code === "42P01";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-6">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="press text-muted hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
        ✍️ Words &amp; settings ·{" "}
        <span className="font-bengali">লেখা ও সেটিংস</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        The pages that are not the homepage, and the details that appear
        everywhere. Each box is empty until you write in it — empty means
        &ldquo;keep the page as it is&rdquo;, so nothing has to be re-typed
        to keep what is already there.{" "}
        <Link href="/admin/homepage" className="font-semibold text-brand">
          The homepage is edited here
        </Link>
        .
      </p>

      {missingTable ? (
        <div className="mt-6 rounded-xl bg-warn-tint px-4 py-3 text-sm font-medium text-warn-ink">
          ⚠️ Run <code>supabase/site-theme.sql</code> in the Supabase SQL
          Editor to turn this on.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {SITE_GROUPS.map((group) => (
            <li key={group.section}>
              <SectionCard
                group={group}
                saved={saved}
                visible
                toggle={null}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
