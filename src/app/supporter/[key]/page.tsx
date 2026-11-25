import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { formatTaka } from "@/lib/format";
import { Card, ButtonLink } from "@/components/ui";
import { CancelMembership } from "./CancelMembership";
import { PostMedia } from "@/components/PostMedia";
import type { CreatorPost } from "@/lib/memberships";

/* A supporter's own page, reached only by the secret link they were
   given when they joined. No account, no password — the link is the
   credential, which is why this page is never indexed. */

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My support — Shohay সহায়",
  robots: { index: false, follow: false },
};

type View = {
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  tier_name: string | null;
  amount: number;
  started_at: string;
  next_due_at: string;
  status: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SupporterPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isSupabaseConfigured() || !key || key.length < 24) notFound();

  const supabase = getSupabaseClient();
  const [viewResult, postsResult] = await Promise.all([
    supabase.rpc("supporter_view", { access_key: key }),
    supabase.rpc("supporter_posts", { access_key: key, max_rows: 30 }),
  ]);

  const view = (viewResult.data as View[] | null)?.[0];
  if (!view) notFound();

  const posts = (postsResult.data ?? []) as CreatorPost[];
  const cancelled = view.status !== "active";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {view.creator_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={view.creator_avatar}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-2xl font-bold text-brand-dark">
              {view.creator_name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm text-muted">You support</p>
            <Link
              href={`/creator/${view.creator_username}`}
              className="block truncate text-xl font-extrabold hover:text-brand"
            >
              {view.creator_name}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Monthly" value={formatTaka(Number(view.amount))} big />
          <Fact label="Tier" value={view.tier_name ?? "Custom"} />
          <Fact label="Since" value={formatDate(view.started_at)} />
          <Fact
            label={cancelled ? "Status" : "Next due"}
            value={cancelled ? "Stopped" : formatDate(view.next_due_at)}
          />
        </div>

        {cancelled ? (
          <p className="mt-5 rounded-xl bg-foreground/5 px-4 py-3 text-sm text-body">
            You&rsquo;ve stopped this monthly support. Nothing more will be
            asked of you.{" "}
            <Link
              href={`/creator/${view.creator_username}/join`}
              className="font-semibold text-brand"
            >
              Start again
            </Link>
          </p>
        ) : (
          <p className="mt-5 rounded-xl bg-warn-tint px-4 py-3 text-sm leading-relaxed text-warn-ink">
            Nothing has been charged yet — card and bKash payments are still
            being connected. {view.creator_name} will be in touch about how to
            pay.
          </p>
        )}
      </Card>

      {/* Posts */}
      <h2 className="mt-10 text-2xl font-extrabold">
        Posts from {view.creator_name}
      </h2>

      {posts.length === 0 ? (
        <Card className="mt-4 p-6 text-center text-sm text-muted">
          Nothing posted yet. Anything {view.creator_name} writes for
          supporters will appear here.
        </Card>
      ) : (
        <ul className="mt-4 space-y-5">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="overflow-hidden">
                <PostMedia
                  imageUrl={post.image_url}
                  videoUrl={post.video_url}
                  alt={post.title}
                />
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.members_only ? (
                      <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold text-brand-dark">
                        SUPPORTERS ONLY
                      </span>
                    ) : null}
                    <span className="text-xs text-muted">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold">{post.title}</p>
                  {post.body ? (
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-body">
                      {post.body}
                    </p>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!cancelled ? (
        <div className="mt-10">
          <CancelMembership accessKey={key} />
        </div>
      ) : null}

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        Keep this page&rsquo;s link — it&rsquo;s the only way back in. Lost it?
        Ask {view.creator_name} and they can send it again.
      </p>

      <div className="mt-6 text-center">
        <ButtonLink href="/campaigns" variant="secondary" size="sm">
          Browse campaigns
        </ButtonLink>
      </div>
    </main>
  );
}

function Fact({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl bg-background px-4 py-3">
      <p className={`font-extrabold ${big ? "text-lg text-brand" : "text-sm"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
