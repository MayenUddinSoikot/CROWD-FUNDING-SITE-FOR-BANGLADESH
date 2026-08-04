"use client";

import { useEffect } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";

// Records one page view per campaign per browser session, for the
// admin analytics dashboard. Silent no-op if analytics isn't set up.
export function TrackView({ campaignId }: { campaignId: string }) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const key = `viewed-${campaignId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — count anyway */
    }
    const supabase = getSupabaseClient();
    supabase
      .from("page_views")
      .insert({ campaign_id: campaignId })
      .then(({ error }) => {
        if (error) console.debug("view not recorded:", error.message);
      });
  }, [campaignId]);

  return null;
}
