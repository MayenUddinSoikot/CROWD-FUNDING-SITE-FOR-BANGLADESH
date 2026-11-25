import Link from "next/link";
import { formatTaka, formatCampaignId } from "@/lib/format";
import { ProgressBar, StatusBadge } from "@/components/ui";

/* One campaign on the creator's dashboard.

   The four numbers underneath are chosen to answer the question a
   campaigner actually has, which is never "how much have I raised" —
   they know that — but "why isn't it moving". Views tells them whether
   anyone is arriving; the percentage tells them whether the page is
   convincing the ones who do. */

export type DashboardCampaign = {
  campaign_id: string;
  slug: string;
  title: string;
  status: string;
  campaign_no: number | null;
  goal_amount: number;
  raised_amount: number;
  created_at: string;
  ends_at: string | null;
  is_recurring: boolean;
  views: number;
  views_7d: number;
  donations: number;
  donors: number;
  biggest_gift: number;
  last_gift_at: string | null;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "draft" },
  pending: { label: "In review", tone: "pending" },
  approved: { label: "Live", tone: "live" },
  rejected: { label: "Needs changes", tone: "rejected" },
  completed: { label: "Completed", tone: "completed" },
  frozen: { label: "Frozen", tone: "frozen" },
};

const DAY = 24 * 60 * 60 * 1000;

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.ceil(ms / DAY);
}

export function CampaignRow({ campaign }: { campaign: DashboardCampaign }) {
  const status = STATUS[campaign.status] ?? STATUS.draft;
  const raised = Number(campaign.raised_amount) || 0;
  const goal = Number(campaign.goal_amount) || 0;
  const percent = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const views = Number(campaign.views) || 0;
  const donations = Number(campaign.donations) || 0;

  // Of the people who opened the page, how many gave?
  const conversion = views > 0 ? (donations / views) * 100 : null;
  const left = campaign.is_recurring ? null : daysLeft(campaign.ends_at);
  const id = formatCampaignId(campaign.campaign_no);

  return (
    <Link
      href={`/account/campaigns/${campaign.campaign_id}`}
      className="lift block rounded-2xl bg-card p-5 shadow-soft no-underline"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{campaign.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {id ? `ID ${id} · ` : ""}
            {campaign.is_recurring
              ? "Ongoing"
              : left === null
                ? "No end date"
                : left < 0
                  ? "Ended"
                  : `${left} ${left === 1 ? "day" : "days"} left`}
          </p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-lg font-extrabold text-brand">
          {formatTaka(raised)}
        </span>
        <span className="text-sm text-muted">
          of {formatTaka(goal)} · {percent}%
        </span>
      </div>
      <ProgressBar percent={percent} className="mt-2" />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure value={views.toLocaleString("en-US")} label="Views" />
        <Figure
          value={(Number(campaign.views_7d) || 0).toLocaleString("en-US")}
          label="Views, 7 days"
        />
        <Figure
          value={(Number(campaign.donors) || 0).toLocaleString("en-US")}
          label="Donors"
        />
        <Figure
          value={conversion === null ? "—" : `${conversion.toFixed(1)}%`}
          label="Gave after viewing"
        />
      </div>
    </Link>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-background px-3 py-2.5">
      <p className="text-base font-extrabold">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted">{label}</p>
    </div>
  );
}
