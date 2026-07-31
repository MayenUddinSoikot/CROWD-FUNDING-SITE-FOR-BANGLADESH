import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { PostForm } from "./PostForm";
import { togglePublish, deletePost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News — Shohay admin" };

export default async function AdminNewsPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, published, created_at")
    .order("created_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin" className="opacity-60 hover:text-brand">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">
        News &amp; stories · <span className="font-bengali">খবর</span>
      </h1>

      <div className="mt-6">
        <PostForm />
      </div>

      <h2 className="mt-8 text-lg font-bold">
        {posts.length} post{posts.length === 1 ? "" : "s"}
      </h2>
      <ul className="mt-3 space-y-2">
        {posts.map((post) => (
          <li
            key={post.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{post.title}</p>
              <p className="text-xs opacity-50">
                {post.published ? "Published" : "Draft"} ·{" "}
                {timeAgo(post.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {post.published ? (
                <Link
                  href={`/news/${post.slug}`}
                  className="text-sm opacity-60 hover:text-brand"
                >
                  View
                </Link>
              ) : null}
              <form action={togglePublish}>
                <input type="hidden" name="id" value={post.id} />
                <input
                  type="hidden"
                  name="publish"
                  value={(!post.published).toString()}
                />
                <button
                  type="submit"
                  className="rounded-full border border-foreground/20 px-3 py-1 text-xs font-semibold hover:border-brand hover:text-brand"
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
              </form>
              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <button
                  type="submit"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
