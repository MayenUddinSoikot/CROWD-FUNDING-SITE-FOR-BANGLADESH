import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News & stories — Shohay সহায়",
};

async function getPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("posts")
      .select(
        "id, slug, title, title_bn, excerpt, cover_image_url, published, created_at"
      )
      .eq("published", true)
      .order("created_at", { ascending: false });
    return (data as Post[]) ?? [];
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
      <h1 className="mt-10 font-serif text-3xl font-bold">
        News &amp; stories
      </h1>
      <p className="font-bengali mt-1 text-lg opacity-80">খবর ও গল্প</p>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
          No posts yet. Check back soon.
          <span className="font-bengali block pt-1">এখনো কিছু নেই।</span>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/news/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card transition hover:border-brand/50 sm:flex-row"
              >
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="h-40 w-full object-cover sm:h-auto sm:w-48"
                  />
                ) : null}
                <div className="flex-1 p-5">
                  <h2 className="font-serif text-lg font-semibold group-hover:text-brand">
                    {post.title}
                  </h2>
                  {post.title_bn ? (
                    <p className="font-bengali text-sm opacity-80">
                      {post.title_bn}
                    </p>
                  ) : null}
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm opacity-70">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs opacity-50">
                    {timeAgo(post.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
