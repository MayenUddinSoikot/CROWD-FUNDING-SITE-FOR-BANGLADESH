import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { formatTaka } from "@/lib/format";
import { Card, EmptyState, ButtonLink } from "@/components/ui";
import { SafeImage } from "@/components/SafeImage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Top fundraisers — Shohay সহায়",
  description:
    "The creators bringing in the most for Bangladeshi families on Shohay this week, this month and all time.",
};

type Row = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  donation_count: number;
  supporters: number;
  total_raised: number;
};

const PERIODS = [
  { key: "week", label: "This week", bn: "এই সপ্তাহ", days: 7 },
  { key: "month", label: "This month", bn: "এই মাস", days: 30 },
  { key: "all", label: "All time", bn: "সর্বকালের", days: null },
] as const;

async function getBoard(days: number | null): Promise<Row[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseClient();
    const since =
      days === null
        ? null
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc("referrer_leaderboard", {
      since,
      max_rows: 50,
    });
    // referrals.sql not run yet — show the empty state, not an error page.
    if (error) return [];
    return (data ?? []) as Row[];
  } catch {
    return [];
  }
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const active = PERIODS.find((p) => p.key === period) ?? PERIODS[1];
  const rows = await getBoard(active.days);

  const totalRaised = rows.reduce((sum, r) => sum + Number(r.total_raised), 0);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Top fundraisers</h1>
      <p className="font-bengali mt-1 text-lg text-muted">
        যাঁরা সবচেয়ে বেশি সাহায্য এনেছেন
      </p>
      <p className="mt-3 max-w-xl leading-relaxed text-body">
        Share a campaign with your own link and every taka it brings in is
        counted here, under your name.
      </p>

      {/* Period switch */}
      <div
        className="scroll-x mt-6 flex gap-2"
        role="tablist"
        aria-label="Time period"
      >
        {PERIODS.map((p) => {
          const on = p.key === active.key;
          return (
            <Link
              key={p.key}
              href={`/leaderboard?period=${p.key}`}
              role="tab"
              aria-selected={on}
              scroll={false}
              className={`press inline-flex min-h-[44px] shrink-0 items-center rounded-full px-5 text-sm font-bold no-underline ${
                on
                  ? "bg-brand text-white shadow-brand"
                  : "border border-foreground/15 bg-card text-body hover:border-brand hover:text-brand"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nobody on the board yet"
            bn="এখনও কেউ নেই"
            hint="The first creator to share a campaign with their own link takes the top spot."
            action={
              <ButtonLink href="/campaigns" variant="primary">
                Find a campaign to share
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-brand-dark">
            {formatTaka(totalRaised)} raised by {rows.length}{" "}
            {rows.length === 1 ? "creator" : "creators"} · {active.label.toLowerCase()}
          </p>

          <ol className="mt-4 space-y-3">
            {rows.map((row, i) => (
              <li key={row.id}>
                <Card
                  hover
                  className={`flex items-center gap-4 p-4 ${
                    i < 3 ? "ring-1 ring-brand/20" : ""
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
                      i < 3
                        ? "bg-brand-tint text-brand-dark"
                        : "bg-track text-muted"
                    }`}
                    aria-label={`Position ${i + 1}`}
                  >
                    {MEDALS[i] ?? i + 1}
                  </span>

                  <SafeImage
                    src={row.avatar_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    fallback={
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-tint text-lg font-bold text-brand-dark">
                        {(row.display_name ?? row.username)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    }
                  />

                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/creator/${row.username}`}
                      className="block truncate font-bold hover:text-brand"
                    >
                      {row.display_name ?? row.username}
                    </Link>
                    <span className="block truncate text-sm text-muted">
                      @{row.username} · {row.supporters}{" "}
                      {row.supporters === 1 ? "supporter" : "supporters"}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-extrabold text-brand">
                      {formatTaka(Number(row.total_raised))}
                    </span>
                    <span className="block text-xs text-muted">
                      {row.donation_count}{" "}
                      {row.donation_count === 1 ? "gift" : "gifts"}
                    </span>
                  </span>
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}

      <Card className="mt-10 p-6">
        <p className="font-bold">How the credit works</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Every creator page has a personal link. Anyone who opens it and
          donates within 30 days is counted towards you — on any campaign, not
          just your own. If someone else&rsquo;s link is opened later, the
          newest one wins.
        </p>
        <p className="mt-3 text-sm text-muted">
          Your link is on your{" "}
          <Link href="/account" className="font-semibold text-brand">
            account page
          </Link>
          .
        </p>
      </Card>
    </main>
  );
}
