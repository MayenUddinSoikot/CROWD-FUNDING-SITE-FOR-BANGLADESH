import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import type { SiteMedia } from "@/lib/types";
import { Button, Card, EmptyState, StatusBadge } from "@/components/ui";
import { MediaFrame } from "@/components/MediaTile";
import { SiteMediaForm } from "./SiteMediaForm";
import { SectionCard } from "./ContentEditor";
import { toggleSection } from "./content-actions";
import { HOMEPAGE_GROUPS } from "@/lib/homepage-fields";
import { removeSiteMedia, toggleSiteMedia } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Homepage media — Shohay সহায়" };

export default async function HomepageMediaPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data, error } = await supabase
    .from("site_media")
    .select("id, slot, media_type, url, title, subtitle, link_url, position, published")
    .order("slot", { ascending: true })
    .order("position", { ascending: true });

  const items = (data ?? []) as SiteMedia[];
  const missingTable = error?.code === "42P01";

  // Words and on/off switches for every block of the homepage.
  const [contentResult, sectionResult] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_sections").select("key, visible"),
  ]);
  const savedText: Record<string, string> = {};
  for (const row of contentResult.data ?? []) {
    const r = row as { key: string; value: string | null };
    if (r.value) savedText[r.key] = r.value;
  }
  const hiddenSections = new Set(
    (sectionResult.data ?? [])
      .filter((r) => (r as { visible: boolean }).visible === false)
      .map((r) => (r as { key: string }).key)
  );
  const themeTableMissing = contentResult.error?.code === "42P01";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-6">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="press text-muted hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
        🖼️ Homepage media · <span className="font-bengali">ছবি ও ভিডিও</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Photos and videos you put on the homepage yourself. Every
        published <b>Hero</b> is one slide of the big rotating banner at
        the top — add two or three and they cycle, in <b>position</b>
        order. A video slide plays itself, silently and on a loop, so use
        a short clip with nothing important in the sound.
      </p>

      {missingTable ? (
        <div className="mt-6 rounded-xl bg-warn-tint px-4 py-3 text-sm font-medium text-warn-ink">
          ⚠️ Run <code>supabase/site-media.sql</code> in the Supabase SQL
          Editor to turn this on.
        </div>
      ) : null}

      <div className="mt-6">
        <SiteMediaForm />
      </div>

      {/* ===== Words, and which blocks show at all ===== */}
      <h2 className="mt-12 text-lg font-bold">
        Words on the homepage ·{" "}
        <span className="font-bengali">হোমপেজের লেখা</span>
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
        Every heading, paragraph and button on the homepage. Change one
        and the page updates straight away. Empty a box and save to put
        the original wording back.
      </p>

      {themeTableMissing ? (
        <div className="mt-4 rounded-xl bg-warn-tint px-4 py-3 text-sm font-medium text-warn-ink">
          ⚠️ Run <code>supabase/site-theme.sql</code> in the Supabase SQL
          Editor to turn this on.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {HOMEPAGE_GROUPS.map((group) => {
            const visible = !hiddenSections.has(group.section);
            return (
              <li key={group.section}>
                <SectionCard
                  group={group}
                  saved={savedText}
                  visible={visible}
                  toggle={
                    <form action={toggleSection}>
                      <input type="hidden" name="key" value={group.section} />
                      <input
                        type="hidden"
                        name="visible"
                        value={visible ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="press rounded-full border border-foreground/15 px-4 py-2 text-xs font-bold hover:border-brand hover:text-brand"
                      >
                        {visible ? "Hide section" : "Show section"}
                      </button>
                    </form>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-bold">On the homepage now</h2>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing added yet"
            hint="Add a photo or video above and it appears on the homepage straight away."
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="overflow-hidden">
                <div className="aspect-video w-full bg-brand-tint">
                  <MediaFrame item={item} />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.slot === "hero" ? "live" : "draft"}>
                      {item.slot === "hero" ? "Hero" : "Stories strip"}
                    </StatusBadge>
                    <StatusBadge tone={item.published ? "approved" : "pending"}>
                      {item.published ? "Visible" : "Hidden"}
                    </StatusBadge>
                    <span className="text-xs font-medium text-muted">
                      {item.media_type}
                    </span>
                  </div>

                  {item.title ? (
                    <p className="mt-3 font-bold">{item.title}</p>
                  ) : null}
                  {item.subtitle ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {item.subtitle}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={toggleSiteMedia}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={item.published ? "false" : "true"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {item.published ? "Hide" : "Show"}
                      </Button>
                    </form>
                    <form action={removeSiteMedia}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="danger" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
