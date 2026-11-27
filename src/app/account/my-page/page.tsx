import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Card, ButtonLink } from "@/components/ui";
import { CreatorProfileForm } from "../CreatorProfileForm";
import { PublishToggle } from "./PublishToggle";
import { AccountKindCard } from "@/components/AccountKindCard";
import { siteUrl } from "@/app/layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My page — Shohay সহায়" };

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const { saved } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fields = "username, display_name, bio, avatar_url";
  const first = await supabase
    .from("profiles")
    .select(
      `${fields}, social_links, full_name, phone, cover_url, focus, page_published, account_kind`
    )
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
    focus: null,
    username: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    cover_url: null,
    full_name: null,
    phone: null,
    social_links: null,
    page_published: false,
    account_kind: null,
  };

  if (!profile.username) redirect("/setup");

  const url = `${siteUrl.replace(/\/$/, "")}/creator/${profile.username}`;

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        My creator page
      </h1>
      <p className="mt-1 text-sm text-muted">
        Your own page on Shohay ·{" "}
        <span className="font-bengali">আপনার নিজের পেজ</span>
      </p>

      {/* The two things are easy to confuse, and confusing them wastes
          a campaigner's time: they set up a page expecting a goal and a
          deadline, or start a campaign expecting it to last. Say which
          is which, once, where the decision is made. */}
      <Card className="mt-5 bg-brand-tint/60 p-5">
        <p className="text-sm font-bold text-brand-dark">
          Your page is not a campaign
        </p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-body">
          <li>
            <b>This page</b> stays open for as long as you want it. No goal,
            no deadline. People follow it, read your posts and can support
            you every month.
          </li>
          <li>
            <b>A campaign</b> is one appeal with a goal and an end date —
            medical bills, school fees, flood relief. You can run as many as
            you like from this page, and each is checked by our team before
            it goes live.
          </li>
          <li>
            <b>A donation</b> is a single gift to one campaign. The giver
            needs no account.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/start" size="sm">
            Start a campaign
          </ButtonLink>
          <ButtonLink href="/account/supporters" size="sm" variant="secondary">
            Set up monthly support
          </ButtonLink>
        </div>
      </Card>

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

      <AccountKindCard
        current={
          ((profile as { account_kind?: string | null }).account_kind ?? null)
        }
        saved={saved === "kind"}
      />

      <div className="mt-6">
        <CreatorProfileForm
          profile={profile}
          email={user.email}
          userId={user.id}
        />
      </div>

      <p className="mt-6 text-sm text-muted">
        Monthly tiers and supporters-only posts live on your{" "}
        <Link href="/account/supporters" className="font-semibold text-brand">
          supporters page
        </Link>
        . Campaigns, with their goals and deadlines, are on your{" "}
        <Link href="/account" className="font-semibold text-brand">
          dashboard
        </Link>
        .
      </p>
    </>
  );
}
