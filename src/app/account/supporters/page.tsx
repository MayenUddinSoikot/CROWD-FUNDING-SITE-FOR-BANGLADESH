import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import { Card } from "@/components/ui";
import { TierForm, PostForm } from "./Forms";
import { removeTier, removePost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Supporters — Shohay সহায়",
};

type Tier = {
  id: string;
  name: string;
  name_bn: string | null;
  amount: number;
  perks: string | null;
};

type Supporter = {
  id: string;
  supporter_name: string | null;
  supporter_email: string | null;
  supporter_phone: string | null;
  amount: number;
  message: string | null;
  is_public: boolean;
  status: string;
  started_at: string;
  next_due_at: string;
};

type Post = {
  id: string;
  title: string;
  members_only: boolean;
  created_at: string;
};

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SupportersPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, tiersResult, supportersResult, postsResult, statsResult] =
    await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      supabase
        .from("membership_tiers")
        .select("id, name, name_bn, amount, perks")
        .eq("creator_id", user.id)
        .eq("active", true)
        .order("amount", { ascending: true }),
      supabase
        .from("memberships")
        .select(
          "id, supporter_name, supporter_email, supporter_phone, amount, message, is_public, status, started_at, next_due_at"
        )
        .eq("creator_id", user.id)
        .order("started_at", { ascending: false }),
      supabase
        .from("creator_posts")
        .select("id, title, members_only, created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("my_membership_stats"),
    ]);

  const username = (profileResult.data?.username as string | null) ?? null;
  const tiers = (tiersResult.data ?? []) as Tier[];
  const supporters = (supportersResult.data ?? []) as Supporter[];
  const posts = (postsResult.data ?? []) as Post[];
  const stats = (statsResult.data?.[0] as
    | { supporters: number; monthly_total: number }
    | undefined) ?? { supporters: 0, monthly_total: 0 };

  const active = supporters.filter((s) => s.status === "active");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 sm:px-6">
      <Link href="/account" className="press mt-8 inline-block text-sm font-bold text-brand">
        ← My account
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
        Supporters · <span className="font-bengali">সমর্থকরা</span>
      </h1>
      <p className="mt-2 leading-relaxed text-body">
        Monthly support is what lets you plan ahead instead of starting from
        zero with every campaign.
      </p>

      {!username ? (
        <p className="mt-4 rounded-xl bg-warn-tint px-4 py-3 text-sm text-warn-ink">
          Pick a username on your{" "}
          <Link href="/account" className="font-bold underline">
            account page
          </Link>{" "}
          first — supporters join from your creator page, and you don&rsquo;t
          have one until then.
        </p>
      ) : null}

      <p className="mt-4 rounded-xl bg-warn-tint px-4 py-3 text-sm leading-relaxed text-warn-ink">
        <b>Nothing is charged automatically yet.</b> bKash auto-debit needs a
        merchant agreement, so for now a membership is a monthly pledge with a
        due date, and you collect it yourself. Everything here keeps working
        unchanged once real recurring payments are connected.
      </p>

      {/* Numbers */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Card className="p-5">
          <p className="text-2xl font-extrabold text-brand">
            {formatTaka(Number(stats.monthly_total))}
          </p>
          <p className="mt-0.5 text-sm text-muted">Pledged each month</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-extrabold">{stats.supporters}</p>
          <p className="mt-0.5 text-sm text-muted">
            {Number(stats.supporters) === 1 ? "Supporter" : "Supporters"}
          </p>
        </Card>
      </div>

      {/* Tiers */}
      <h2 className="mt-10 text-xl font-bold">Your tiers</h2>
      {tiers.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          No tiers yet. Two or three is plenty — most people pick the middle
          one.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tiers.map((t) => (
            <li key={t.id}>
              <Card className="flex items-start justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block font-bold">
                    {t.name}
                    <span className="ml-2 font-extrabold text-brand">
                      {formatTaka(Number(t.amount))}
                      <span className="text-xs font-semibold text-muted">
                        /mo
                      </span>
                    </span>
                  </span>
                  {t.perks ? (
                    <span className="mt-1 block whitespace-pre-line text-sm text-muted">
                      {t.perks}
                    </span>
                  ) : null}
                </span>
                <form action={removeTier} className="shrink-0">
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="press rounded-full border border-foreground/15 px-3 py-2 text-xs font-bold hover:border-accent hover:text-accent"
                  >
                    Retire
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-4 p-5">
        <p className="font-bold">Add a tier</p>
        <div className="mt-3">
          <TierForm />
        </div>
      </Card>

      {/* Posts */}
      <h2 className="mt-10 text-xl font-bold">Posts</h2>
      <p className="mt-1 text-sm text-muted">
        Public posts show on your creator page. Supporters-only posts are
        visible to people paying you monthly.
      </p>

      {posts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="text-xs text-muted">
                    {date(p.created_at)} ·{" "}
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
      ) : null}

      <Card className="mt-4 p-5">
        <p className="font-bold">Write a post</p>
        <div className="mt-3">
          <PostForm />
        </div>
      </Card>

      {/* Supporter list */}
      <h2 className="mt-10 text-xl font-bold">
        Who&rsquo;s supporting you ({active.length})
      </h2>
      {supporters.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Nobody yet. Share your creator page — monthly supporters usually come
          from people who already follow you.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {supporters.map((s) => (
            <li key={s.id}>
              <Card
                className={`p-4 ${s.status === "active" ? "" : "opacity-55"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">
                    {s.supporter_name ?? "Someone"}
                    {!s.is_public ? (
                      <span className="ml-2 text-xs font-semibold text-muted">
                        (private)
                      </span>
                    ) : null}
                  </span>
                  <span className="font-extrabold text-brand">
                    {formatTaka(Number(s.amount))}
                    <span className="text-xs font-semibold text-muted">/mo</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {s.supporter_email ?? s.supporter_phone ?? "no contact given"}{" "}
                  · since {date(s.started_at)}
                  {s.status === "active"
                    ? ` · next due ${date(s.next_due_at)}`
                    : " · stopped"}
                </p>
                {s.message ? (
                  <p className="mt-2 rounded-lg bg-background px-3 py-2 text-sm italic text-body">
                    “{s.message}”
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
