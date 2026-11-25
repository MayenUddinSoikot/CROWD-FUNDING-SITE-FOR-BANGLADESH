"use client";

import { useEffect } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

/* Counts one view of a campaign.

   Once per browser session per campaign, so somebody refreshing the
   page or coming back from the donate form doesn't inflate the number
   the creator is judging their campaign by. It is a measure of reach,
   not of page loads.

   Fails silently in every case: a view that doesn't get counted is a
   far smaller problem than a campaign page that breaks. */

export function TrackView({ campaignId }: { campaignId: string }) {
  useEffect(() => {
    if (!isSupabaseConfigured() || !campaignId) return;

    const key = `shohay_seen_${campaignId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private browsing, or storage blocked. Count it anyway.
    }

    try {
      void getSupabaseClient()
        .rpc("record_campaign_view", { p_campaign_id: campaignId })
        .then(() => undefined);
    } catch {
      /* ignore */
    }
  }, [campaignId]);

  return null;
}
