import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka, percentRaised, formatCampaignId } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { ShareButtons } from "@/components/ShareButtons";
import { CampaignUpdateForm } from "@/components/CampaignUpdateForm";
import { GoalForm } from "./GoalForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage campaign — Shohay সহায়" };

const STATUS_LABEL: Record<Campaign["status"], { en: string; bn: string; className: string }> = {
  draft: { en: "Draft", bn: "খসড়া", className: "bg-foreground/10 text-foreground" },
  pending: { en: "Pending review", bn: "পর্যালোচনাধীন", className: "bg-amber-500/15 text-amber-700" },
  approved: { en: "Live", bn: "চলছে", className: "bg-brand/15 text-brand" },
  rejected: { en: "Needs changes", bn: "সংশোধন দরকার", className: "bg-accent/15 text-accent" },
  completed: { en: "Completed", bn: "সম্পন্ন", className: "bg-foreground/10 text-foreground" },
  frozen: { en: "Frozen", bn: "স্থগিত", className: "bg-sky-500/15 text-sky-700" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / DAY_MS);
}

function cycleDaysLeft(anchor: string | null, cycleDays: number): number | null {
  if (!anchor) return null;
  const a = new Date(anchor).getTime();
  if (Number.isNaN(a)) return null;
  const cyc = cycleDays * DAY_MS;
  const passed = Math.floor((Date.now() - a) / cyc);
  const end = a + (passed + 1) * cyc;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
}

export default async function ManageCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const manageFields =
    "id, slug, title, title_bn, category, goal_amount, raised_amount, status, campaign_type, is_recurring, cycle_days, cycle_anchor, district, ends_at, created_at, creator_id";
  let { data } = await supabase
    .from("campaigns")
    .select(`${manageFields}, campaign_no`)
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (!data) {
    // campaign_no exists only after campaign-ids.sql — fall back safely.
    const retry = await supabase
      .from("campaigns")
      .select(manageFields)
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    data = (retry.data ?? null) as unknown as typeof data;
  }
  if (!data) notFound();
  const c = data as Campaign;

  const status = STATUS_LABEL[c.status];
  const created = daysAgo(c.created_at);
  const remaining = c.is_recurring
    ? cycleDaysLeft(c.cycle_anchor, c.cycle_days)
    : daysLeft(c.ends_at);
  const ended =
    !c.is_recurring && remaining !== null && remaining < 0;
  const percent = percentRaised(c.raised_amount, c.goal_amount);
  const isPublic = c.status === "approved" || c.status === "completed";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/account" className="opacity-60 hover:text-brand">
          ← My campaigns
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.en} · <span className="font-bengali">{status.bn}</span>
        </span>
        {formatCampaignId(c.campaign_no) ? (
          <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs font-semibold">
            ID {formatCampaignId(c.campaign_no)}
          </span>
        ) : null}
        <span className="text-xs opacity-60">
          Created {created === 0 ? "today" : `${created} day${created === 1 ? "" : "s"} ago`}
        </span>
        {c.is_recurring ? (
          <span className="text-xs opacity-60">
            · ☕ monthly — {remaining} day{remaining === 1 ? "" : "s"} left this cycle
          </span>
        ) : remaining !== null ? (
          <span className="text-xs opacity-60">
            {ended
              ? "· campaign has ended"
              : `· ${remaining} day${remaining === 1 ? "" : "s"} remaining`}
          </span>
        ) : null}
      </div>

      <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{c.title}</h1>
      {c.title_bn ? (
        <p className="font-bengali text-lg opacity-80">{c.title_bn}</p>
      ) : null}

      {/* Money */}
      <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-brand">{formatTaka(c.raised_amount)}</p>
          <p className="text-sm opacity-60">
            {c.is_recurring
              ? `this month of ${formatTaka(c.goal_amount)} target`
              : `raised of ${formatTaka(c.goal_amount)} goal`}
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar percent={percent} />
        </div>
        <p className="mt-2 text-sm opacity-60">{percent}% funded</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/account/campaigns/${c.id}/report`}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            📄 Download report (PDF)
          </Link>
          {isPublic ? (
            <Link
              href={`/campaigns/${c.slug}`}
              className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              View public page →
            </Link>
          ) : null}
        </div>

        <p className="mt-4 rounded-xl bg-background p-3 text-xs leading-relaxed opacity-70">
          💸 <span className="font-semibold">Payout:</span>{" "}
          {c.is_recurring
            ? "Your support is paid out after each 30-day cycle ends (within 3 days), minus the ~3% bank/processing fee."
            : "Collected funds are transferred to your bKash/bank 3 days after the campaign ends, minus the ~3% bank/processing fee."}{" "}
          <span className="font-bengali">
            ক্যাম্পেইন শেষ হওয়ার ৩ দিন পর টাকা পাঠানো হয়।
          </span>
        </p>
      </div>

      {/* Share */}
      {isPublic ? (
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
          <h2 className="text-sm font-bold text-brand">
            Share your campaign · শেয়ার করুন
          </h2>
          <p className="mt-1 text-xs opacity-60">
            Campaigns shared on Facebook and WhatsApp raise far more.
          </p>
          <div className="mt-3">
            <ShareButtons title={c.title} path={`/campaigns/${c.slug}`} />
          </div>
        </div>
      ) : null}

      {/* Edit goal */}
      <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <h2 className="text-sm font-bold text-brand">
          Edit goal amount · লক্ষ্য পরিবর্তন
        </h2>
        <p className="mt-1 text-xs opacity-60">
          Costs changed? You can raise or lower your{" "}
          {c.is_recurring ? "monthly target" : "goal"} any time.
        </p>
        <div className="mt-4">
          <GoalForm campaignId={c.id} currentGoal={c.goal_amount} />
        </div>
      </div>

      {/* Post update */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-brand">
          Status update · আপডেট
        </h2>
        <p className="mb-3 mt-1 text-xs opacity-60">
          Keep your donors informed — updates with photos build the most trust.
        </p>
        <CampaignUpdateForm campaignId={c.id} slug={c.slug} />
      </div>
    </main>
  );
}
