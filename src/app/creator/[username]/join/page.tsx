import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { PublicCreator } from "@/lib/types";
import { getTiers } from "@/lib/memberships";
import { siteUrl } from "@/app/layout";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

async function getCreator(username: string): Promise<PublicCreator | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabaseClient()
      .from("public_creators")
      .select("id, username, display_name, bio, avatar_url")
      .eq("username", username)
      .maybeSingle();
    return (data as PublicCreator) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreator(username);
  const name = creator?.display_name ?? creator?.username ?? "a creator";
  return { title: `Support ${name} monthly — Shohay সহায়` };
}

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const [{ username }, { tier }] = await Promise.all([params, searchParams]);
  const creator = await getCreator(username);
  if (!creator) notFound();

  const tiers = await getTiers(creator.id);
  const name = creator.display_name ?? creator.username;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/creator/${creator.username}`}
        className="press text-sm font-bold text-brand"
      >
        ← Back to {name}
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold">
        Support {name} every month
      </h1>
      <p className="font-bengali mt-1 text-lg text-muted">
        প্রতি মাসে পাশে থাকুন
      </p>
      <p className="mt-3 leading-relaxed text-body">
        Monthly support is what lets a creator plan — and it&rsquo;s what makes
        them able to keep helping people who need it.
      </p>

      <div className="mt-7">
        <JoinForm
          username={creator.username}
          creatorName={name}
          tiers={tiers}
          initialTierId={tier ?? null}
          siteUrl={siteUrl}
        />
      </div>
    </main>
  );
}
