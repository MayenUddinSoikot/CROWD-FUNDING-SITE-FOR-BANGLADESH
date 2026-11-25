import Link from "next/link";
import { PostMedia } from "@/components/PostMedia";
import type { PostTeaser } from "@/lib/memberships";

/* A creator's post.

   A locked post shows its title and date and nothing else — the body,
   photo and video never leave the database. That is the point: a
   visitor should be able to see that there is something here worth
   joining for, without being handed it. */

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PostCard({
  post,
  joinHref,
  featured = false,
}: {
  post: PostTeaser;
  joinHref: string;
  featured?: boolean;
}) {
  if (post.locked) {
    return (
      <article className="overflow-hidden rounded-2xl bg-card shadow-soft">
        <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light">
          <div className="text-center">
            <span className="text-4xl" aria-hidden="true">
              🔒
            </span>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/90">
              Supporters only
            </p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted">{when(post.created_at)}</p>
          <p
            className={`mt-1 font-bold ${featured ? "text-xl" : "text-base"}`}
          >
            {post.title}
          </p>
          <Link
            href={joinHref}
            className="press mt-3 inline-flex min-h-[40px] items-center rounded-full bg-brand px-4 text-sm font-bold text-white no-underline hover:bg-brand-dark"
          >
            Unlock this post
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-soft">
      <PostMedia
        imageUrl={post.image_url}
        videoUrl={post.video_url}
        alt={post.title}
      />
      <div className="p-5">
        <p className="text-xs text-muted">{when(post.created_at)}</p>
        <p className={`mt-1 font-bold ${featured ? "text-xl" : "text-base"}`}>
          {post.title}
        </p>
        {post.body ? (
          <p
            className={`mt-2 whitespace-pre-line leading-relaxed text-body ${
              featured ? "" : "line-clamp-4"
            }`}
          >
            {post.body}
          </p>
        ) : null}
      </div>
    </article>
  );
}
