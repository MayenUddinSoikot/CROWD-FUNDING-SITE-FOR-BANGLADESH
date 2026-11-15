import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import type { Announcement } from "@/lib/types";
import { Button, Card, EmptyState, StatusBadge } from "@/components/ui";
import { AnnouncementForm } from "./AnnouncementForm";
import { removeAnnouncement, toggleAnnouncement } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcements — Shohay সহায়" };

export default async function AnnouncementsPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data, error } = await supabase
    .from("announcements")
    .select("id, message, message_bn, link_url, tone, position, published")
    .order("position", { ascending: true });

  const items = (data ?? []) as Announcement[];
  const live = items.filter((a) => a.published);
  const missingTable = error?.code === "42P01";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-20 sm:px-6">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="press text-muted hover:text-brand">
          ← Dashboard
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
        📢 Announcements · <span className="font-bengali">ঘোষণা</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        The bar at the very top of every page. Messages rotate every four
        seconds, so keep each one short. Up to three show at a time.
      </p>

      {missingTable ? (
        <div className="mt-6 rounded-xl bg-warn-tint px-4 py-3 text-sm font-medium text-warn-ink">
          ⚠️ Run <code>supabase/announcements.sql</code> in the Supabase SQL
          Editor to turn this on.
        </div>
      ) : null}

      {/* Live preview of the real bar */}
      {live.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Showing now
          </p>
          <div className="mt-2 overflow-hidden rounded-xl shadow-soft">
            {live.map((a) => (
              <p
                key={a.id}
                className={`px-4 py-3 text-center text-[11.5px] font-bold uppercase tracking-wider text-white ${
                  a.tone === "urgent" ? "bg-accent" : "bg-brand-dark"
                }`}
              >
                {a.message}
              </p>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            On the site these rotate one at a time, with arrows.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <AnnouncementForm />
      </div>

      <h2 className="mt-10 text-lg font-bold">
        All messages{" "}
        <span className="font-medium text-muted">
          · {live.length} of 3 showing
        </span>
      </h2>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No messages yet"
            hint="Add one above and it appears at the top of the site straight away."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={a.published ? "approved" : "pending"}>
                    {a.published ? "Showing" : "Hidden"}
                  </StatusBadge>
                  {a.tone === "urgent" ? (
                    <StatusBadge tone="urgent">Red — urgent</StatusBadge>
                  ) : null}
                  {a.link_url ? (
                    <span className="text-xs font-medium text-muted">
                      links to {a.link_url}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 font-bold">{a.message}</p>
                {a.message_bn ? (
                  <p className="font-bengali mt-1 text-sm text-muted">
                    {a.message_bn}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={toggleAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={a.published ? "false" : "true"}
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      {a.published ? "Hide" : "Show"}
                    </Button>
                  </form>
                  <form action={removeAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" variant="danger" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
