import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatTaka, percentRaised, formatCampaignId } from "@/lib/format";
import { ProgressBar } from "@/components/ui";

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const category = CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
  const percent = percentRaised(campaign.raised_amount, campaign.goal_amount);
  const left = campaign.is_recurring ? null : daysLeft(campaign.ends_at);
  const urgent = left !== null && left >= 0 && left <= 7;
  const id = formatCampaignId(campaign.campaign_no);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="lift group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft"
    >
      {/* Media */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-brand-tint">
        {campaign.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-tint to-brand/10 text-5xl">
            {category.emoji}
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-dark">
          {campaign.is_recurring ? "☕ Monthly" : category.en}
        </span>

        {id ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {id}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug transition-colors group-hover:text-brand">
          {campaign.title}
        </h3>
        {campaign.title_bn ? (
          <p className="font-bengali mt-1.5 text-sm text-muted">
            {campaign.title_bn}
          </p>
        ) : null}
        {campaign.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body">
            {campaign.summary}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <ProgressBar percent={percent} />
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="text-xl font-extrabold tracking-tight">
              {formatTaka(campaign.raised_amount)}
            </span>
            <span className="text-xs font-medium text-muted">
              of {formatTaka(campaign.goal_amount)}
            </span>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted">
            <span>{percent}% funded</span>
            {campaign.district ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{campaign.district}</span>
              </>
            ) : null}
            {left !== null && left >= 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span className={urgent ? "font-bold text-accent-ink" : ""}>
                  {left === 0 ? "ends today" : `${left} days left`}
                </span>
              </>
            ) : null}
            {campaign.is_recurring ? (
              <>
                <span aria-hidden="true">·</span>
                <span>this month</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  );
}
