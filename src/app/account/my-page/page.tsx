import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Card, ButtonLink } from "@/components/ui";
import { CreatorProfileForm } from "../CreatorProfileForm";
import { PublishToggle } from "./PublishToggle";
import { siteUrl } from "@/app/layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My page — Shohay সহায়" };

export default async function MyPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fields = "username, display_name, bio, avatar_url";
  const first = await supabase
    .from("profiles")
    .select(`${fields}, social_links, full_name, phone, cover_url, page_published`)
    .eq("id", user.id)
    .maybeSingle();
  let row = first.data;
  if (first.error) {
    const retry = await supabase
      .from("profiles")
      .select(fields)
      .eq("id", user.id)
      .maybeSingle();
    row = retry.data as unknown as typeof row;
  }
  const profile = row ?? {
    username: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    cover_url: null,
    full_name: null,
    phone: null,
    social_links: null,
    page_published: false,
  };

  if (!profile.username) redirect("/setup");

  const url = `${siteUrl.replace(/\/$/, "")}/creator/${profile.username}`;

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">My page</h1>
      <p className="mt-1 text-sm text-muted">
        What donors and supporters see when they open your link.
      </p>

      <Card className="mt-6 p-5">
        <p className="text-sm font-semibold">Your page address</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-4 py-3 text-sm">
            {url}
          </code>
          <ButtonLink
            href={`/creator/${profile.username}`}
            variant="secondary"
            size="sm"
            className="shrink-0"
          >
            View
          </ButtonLink>
        </div>

        <div className="mt-5 border-t border-foreground/[0.07] pt-5">
          <PublishToggle published={profile.page_published !== false} />
        </div>
      </Card>

      <div className="mt-6">
        <CreatorProfileForm profile={profile} email={user.email} />
      </div>

      <p className="mt-6 text-sm text-muted">
        Want tiers and supporters-only posts?{" "}
        <Link href="/account/supporters" className="font-semibold text-brand">
          Set those up here
        </Link>
        .
      </p>
    </>
  );
}
