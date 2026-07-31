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
      <div className="flex items-baseline justify-between">
        <p
          className={`text-2xl font-bold text-brand transition-transform ${
            justUpdated ? "scale-110" : ""
          }`}
        >
          {formatTaka(raised)}
        </p>
        <p className="text-sm opacity-60">
          {monthly
            ? `this month of ${formatTaka(goalAmount)} monthly target`
            : `raised of ${formatTaka(goalAmount)} goal`}
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar percent={percent} />
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm opacity-60">
        {percent}% funded · {donationCount} donation
        {donationCount === 1 ? "" : "s"}
        <span className="inline-flex items-center gap-1 text-xs text-brand">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          live
        </span>
      </p>
    </div>
  );
}
