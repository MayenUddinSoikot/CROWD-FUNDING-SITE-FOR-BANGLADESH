import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatTaka, percentRaised } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const category = CATEGORY_LABELS[campaign.category] ?? CATEGORY_LABELS.other;
  const percent = percentRaised(campaign.raised_amount, campaign.goal_amount);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-sm transition hover:border-brand/50 hover:shadow-lg"
    >
      {campaign.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.cover_image_url}
          alt=""
          loading="lazy"
          className="aspect-[3/2] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 text-5xl">
          {category.emoji}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5 text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          {category.en} · <span className="font-bengali">{category.bn}</span>
          {campaign.district ? (
            <span className="opacity-70"> · {campaign.district}</span>
          ) : null}
        </p>

        <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-brand">
          {campaign.title}
        </h3>
        {campaign.title_bn ? (
          <p className="font-bengali text-sm opacity-80">{campaign.title_bn}</p>
        ) : null}

        {campaign.summary ? (
          <p className="line-clamp-2 text-sm opacity-70">{campaign.summary}</p>
        ) : null}

        <div className="mt-auto pt-3">
          <ProgressBar percent={percent} />
          <div className="mt-2 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-brand">
              {formatTaka(campaign.raised_amount)}
            </span>
            <span className="opacity-60">
              of {formatTaka(campaign.goal_amount)} · {percent}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
