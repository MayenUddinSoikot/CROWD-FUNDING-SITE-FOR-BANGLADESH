import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export const dynamic = "force-dynamic";

async function getPost(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as Post) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post ? `${post.title} — Shohay` : "Not found — Shohay",
    description: post?.excerpt ?? undefined,
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-20">
      <p className="mt-8 text-sm">
        <Link href="/news" className="opacity-60 hover:text-brand">
          ← News &amp; stories
        </Link>
      </p>

      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight">
        {post.title}
      </h1>
      {post.title_bn ? (
        <p className="font-bengali mt-2 text-xl opacity-80">{post.title_bn}</p>
      ) : null}
      <p className="mt-2 text-xs opacity-50">{timeAgo(post.created_at)}</p>

      <SafeImage
        src={post.cover_image_url}
        alt=""
        className="mt-6 w-full rounded-2xl object-cover"
        fallback={null}
      />

      {post.body ? (
        <div className="mt-6 whitespace-pre-line leading-relaxed opacity-90">
          {post.body}
        </div>
      ) : null}
      {post.body_bn ? (
        <div className="font-bengali mt-6 whitespace-pre-line leading-relaxed opacity-80">
          {post.body_bn}
        </div>
      ) : null}
    </main>
  );
}
