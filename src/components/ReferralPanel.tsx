"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTaka } from "@/lib/format";

/* "You raised ৳47,000 for other people's campaigns."

   The number a creator screenshots, plus the link that produced it. */

export type ReferralStats = {
  total_raised: number;
  donation_count: number;
  supporters: number;
  campaigns_helped: number;
};

export type ReferredCampaign = {
  campaign_id: string;
  slug: string;
  title: string;
  total_raised: number;
  donation_count: number;
};

export function ReferralPanel({
  username,
  siteUrl,
  stats,
  campaigns,
}: {
  username: string | null;
  siteUrl: string;
  stats: ReferralStats;
  campaigns: ReferredCampaign[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!username) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <p className="font-bold">Your sharing link</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Pick a username below and you&rsquo;ll get a personal link. Every
          taka raised through it is counted under your name on the{" "}
          <Link href="/leaderboard" className="font-semibold text-brand">
            leaderboard
          </Link>
          .
        </p>
      </div>
    );
  }

  const base = siteUrl.replace(/\/$/, "");
  const myLink = `${base}/creator/${username}?via=${username}`;

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">What you&rsquo;ve brought in</p>
        <Link
          href="/leaderboard"
          className="text-sm font-bold text-brand hover:underline"
        >
          See the leaderboard →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={formatTaka(Number(stats.total_raised))} label="Raised" big />
        <Stat value={String(stats.supporters)} label="Supporters" />
        <Stat value={String(stats.donation_count)} label="Donations" />
        <Stat
          value={String(stats.campaigns_helped)}
          label={stats.campaigns_helped === 1 ? "Campaign" : "Campaigns"}
        />
      </div>

      {/* The link itself */}
      <p className="mt-6 text-sm font-semibold">Your personal link</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-4 py-3 text-sm">
          {myLink}
        </code>
        <button
          type="button"
          onClick={() => copy(myLink, "mine")}
          className="press min-h-[44px] shrink-0 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          {copied === "mine" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Put this in your Instagram bio, your YouTube description, or send it in
        a WhatsApp group. Add <code>?via={username}</code> to the end of{" "}
        <em>any</em> campaign link to get credit for that campaign too.
      </p>

      {campaigns.length > 0 ? (
        <>
          <p className="mt-6 text-sm font-semibold">
            Campaigns you&rsquo;ve raised for
          </p>
          <ul className="mt-2 divide-y divide-foreground/5">
            {campaigns.map((c) => (
              <li
                key={c.campaign_id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <Link
                  href={`/campaigns/${c.slug}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand"
                >
                  {c.title}
                </Link>
                <span className="shrink-0 text-sm font-bold text-brand">
                  {formatTaka(Number(c.total_raised))}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  value,
  label,
  big = false,
}: {
  value: string;
  label: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl bg-background px-4 py-3">
      <p
        className={`font-extrabold ${big ? "text-xl text-brand" : "text-lg"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
