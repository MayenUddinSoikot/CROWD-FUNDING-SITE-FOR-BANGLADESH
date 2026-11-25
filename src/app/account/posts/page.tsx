import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Card, EmptyState, ButtonLink } from "@/components/ui";
import { PostForm } from "../supporters/Forms";
import { removePost } from "../supporters/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Posts — Shohay সহায়" };

type Post = {
  id: string;
  title: string;
  members_only: boolean;
  created_at: string;
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PostsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { data: profile }] = await Promise.all([
    supabase
      .from("creator_posts")
      .select("id, title, members_only, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
  ]);

  const posts = (data ?? []) as Post[];
  const username = (profile?.username as string | null) ?? null;

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Posts</h1>
      <p className="mt-1 text-sm text-muted">
        Public posts appear on your page. Supporters-only posts show there as
        locked cards — people can see the title, which is what makes them join.
      </p>

      {!username ? (
        <p className="mt-5 rounded-xl bg-warn-tint px-4 py-3 text-sm text-warn-ink">
          Posts show on your creator page, and you don&rsquo;t have one yet.{" "}
          <Link href="/setup" className="font-bold underline">
            Set it up first
          </Link>
          .
        </p>
      ) : null}

      <Card className="mt-6 p-5">
        <p className="font-bold">Write a post</p>
        <div className="mt-3">
          <PostForm />
        </div>
      </Card>

      <h2 className="mt-10 text-xl font-bold">
        Everything you&rsquo;ve written{posts.length > 0 ? ` (${posts.length})` : ""}
      </h2>

      {posts.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing posted yet"
            hint="One public post is enough to stop your page looking abandoned."
            action={
              username ? (
                <ButtonLink href={`/creator/${username}`} variant="secondary">
                  See your page
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="text-xs text-muted">
                    {when(p.created_at)} ·{" "}
                    {p.members_only ? "Supporters only" : "Public"}
                  </span>
                </span>
                <form action={removePost} className="shrink-0">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="press rounded-full border border-foreground/15 px-3 py-2 text-xs font-bold hover:border-accent hover:text-accent"
                  >
                    Delete
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
