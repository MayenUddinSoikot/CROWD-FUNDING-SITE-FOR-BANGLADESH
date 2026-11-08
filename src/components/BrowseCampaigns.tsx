import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, CampaignCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CampaignCard } from "@/components/CampaignCard";

export const FILTERS: { key: string; label: string; bn: string }[] = [
  { key: "creators", label: "Creators ☕", bn: "ক্রিয়েটর" },
  { key: "birthday", label: "Birthdays 🎂", bn: "জন্মদিন" },
  { key: "just_launched", label: "Just launched", bn: "নতুন" },
  { key: "almost", label: "Almost there", bn: "প্রায় পূর্ণ" },
  { key: "needs_boost", label: "Needs a boost", bn: "সাহায্য দরকার" },
  { key: "ending_soon", label: "Ending soon", bn: "শেষ হচ্ছে" },
];

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function applySpecialFilter(
  list: Campaign[],
  filter: string | undefined
): Campaign[] {
  if (filter === "creators") {
    return list.filter((c) => c.campaign_type === "creator");
  }
  if (filter === "birthday") {
    return list.filter((c) => c.occasion === "birthday");
  }
  if (filter === "just_launched") {
    const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
    return list.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }
  if (filter === "almost") {
    return list.filter(
      (c) => c.goal_amount > 0 && c.raised_amount / c.goal_amount >= 0.75
    );
  }
  if (filter === "needs_boost") {
    return list.filter(
      (c) => c.goal_amount > 0 && c.raised_amount / c.goal_amount < 0.2
    );
  }
  if (filter === "ending_soon") {
    return list.filter((c) => {
      const d = daysLeft(c.ends_at);
      return d !== null && d >= 0 && d <= 7;
    });
  }
  return list;
}

const SEARCH_FIELDS =
  "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, video_url, beneficiary_name, organizer_name, organizer_relationship, campaign_type, occasion, is_recurring, cycle_days, cycle_anchor, district, ends_at, created_at";

async function getAllCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseClient();
    const run = (fields: string) =>
      supabase
        .from("campaigns")
        .select(fields)
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(200);

    // campaign_no exists only after campaign-ids.sql — fall back safely.
    let { data, error } = await run(`${SEARCH_FIELDS}, campaign_no`);
    if (error) ({ data, error } = await run(SEARCH_FIELDS));
    return (data as unknown as Campaign[]) ?? [];
  } catch {
    return [];
  }
}

// "SH-1042", "sh1042" or "1042" → 1042; null if not an ID-style query.
function parseIdQuery(query: string): number | null {
  const m = /^(?:sh[-\s]?)?(\d{1,12})$/i.exec(query.trim());
  return m ? Number(m[1]) : null;
}

export async function BrowseCampaigns({
  q,
  filter,
  category,
  heading,
  headingBn,
  intro,
  // The page these filter chips link back to, so /creators stays
  // on /creators instead of bouncing people to /search.
  basePath = "/search",
  lockedFilter = false,
}: {
  q?: string;
  filter?: string;
  category?: string;
  heading: string;
  headingBn: string;
  intro?: string;
  basePath?: string;
  lockedFilter?: boolean;
}) {
  const query = (q ?? "").trim().toLowerCase();
  const activeCategory =
    category && category in CATEGORY_LABELS
      ? (category as CampaignCategory)
      : null;

  let results = await getAllCampaigns();

  if (query) {
    const idQuery = parseIdQuery(query);
    results = results.filter(
      (c) =>
        (idQuery !== null && c.campaign_no === idQuery) ||
        [c.title, c.title_bn, c.summary, c.beneficiary_name, c.organizer_name]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query))
    );
  }
  if (activeCategory) {
    results = results.filter((c) => c.category === activeCategory);
  }
  results = applySpecialFilter(results, filter);

  const chipBase =
    "rounded-full border px-4 py-1.5 text-sm transition whitespace-nowrap";
  const chipOn = "border-brand bg-brand text-white";
  const chipOff = "border-foreground/20 hover:border-brand hover:text-brand";

  const linkWith = (params: URLSearchParams) => {
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
      <h1 className="mt-8 text-2xl font-bold">
        {heading} · <span className="font-bengali">{headingBn}</span>
      </h1>
      {intro ? <p className="mt-2 text-sm opacity-70">{intro}</p> : null}

      {/* Search box */}
      <form action={basePath} className="mt-4">
        {lockedFilter && filter ? (
          <input type="hidden" name="filter" value={filter} />
        ) : null}
        <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-card px-4 py-1.5 focus-within:border-brand">
          <span className="opacity-50">🔍</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search campaigns, people, causes, or ID (SH-1042)…"
            className="w-full bg-transparent py-2 outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Search
          </button>
        </div>
      </form>

      {/* Special filters — hidden on a page that is already one filter */}
      {lockedFilter ? null : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={linkWith(new URLSearchParams(q ? { q } : {}))}
            className={`${chipBase} ${
              !filter && !activeCategory ? chipOn : chipOff
            }`}
          >
            All · <span className="font-bengali">সব</span>
          </Link>
          {FILTERS.map((f) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("filter", f.key);
            return (
              <Link
                key={f.key}
                href={linkWith(params)}
                className={`${chipBase} ${filter === f.key ? chipOn : chipOff}`}
              >
                {f.label} · <span className="font-bengali">{f.bn}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Category chips */}
      <div className="mt-2 flex flex-wrap gap-2">
        {(
          Object.entries(CATEGORY_LABELS) as [
            CampaignCategory,
            (typeof CATEGORY_LABELS)[CampaignCategory],
          ][]
        ).map(([key, label]) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (lockedFilter && filter) params.set("filter", filter);
          params.set("category", key);
          return (
            <Link
              key={key}
              href={linkWith(params)}
              className={`${chipBase} ${
                activeCategory === key ? chipOn : chipOff
              }`}
            >
              {label.emoji} {label.en}
            </Link>
          );
        })}
      </div>

      {/* Results */}
      <p className="mt-6 text-sm opacity-60">
        {results.length} campaign{results.length === 1 ? "" : "s"} found
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm opacity-70">
          No campaigns match your search.
          <span className="font-bengali block pt-1">কিছু পাওয়া যায়নি।</span>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </main>
  );
}
