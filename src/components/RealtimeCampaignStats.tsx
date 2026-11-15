"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import { formatTaka, percentRaised } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

// Render with key={campaignId} from the parent so navigating between two
// campaign pages remounts this with fresh state instead of syncing via effect.
export function RealtimeCampaignStats({
  campaignId,
  initialRaised,
  goalAmount,
  donationCount,
  monthly = false,
}: {
  campaignId: string;
  initialRaised: number;
  goalAmount: number;
  donationCount: number;
  monthly?: boolean;
}) {
  const [raised, setRaised] = useState(initialRaised);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          const updated = payload.new as { raised_amount: number };
          setRaised(updated.raised_amount);
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const percent = percentRaised(raised, goalAmount);

  return (
    <div>
      {/* Raised is the headline; the goal sits quietly beneath it. */}
      <p
        className={`text-4xl font-extrabold leading-none tracking-tight transition-transform duration-300 ${
          justUpdated ? "scale-105 text-brand" : ""
        }`}
      >
        {formatTaka(raised)}
      </p>
      <p className="mt-2.5 text-sm text-muted">
        {monthly
          ? `this month of ${formatTaka(goalAmount)} monthly target`
          : `raised of ${formatTaka(goalAmount)} goal`}
      </p>

      <div className="mt-4">
        <ProgressBar percent={percent} className="h-3" />
      </div>

      <p className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="font-bold text-brand-dark">{percent}% funded</span>
        <span className="text-muted">
          {donationCount} donation{donationCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          live
        </span>
      </p>
    </div>
  );
}
