"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/anon";
import type { Campaign, CampaignCategory } from "@/lib/types";
import { CampaignCard } from "@/components/CampaignCard";

// Render with key={activeCategory} from the parent so switching category
// filters remounts this with fresh state instead of syncing via an effect.
export function RealtimeCampaignGrid({
  initialCampaigns,
  activeCategory,
}: {
  initialCampaigns: Campaign[];
  activeCategory: CampaignCategory | null;
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel("campaigns-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns" },
        (payload) => {
          const updated = payload.new as Campaign;
          setCampaigns((current) =>
            current.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "campaigns" },
        (payload) => {
          const created = payload.new as Campaign;
          const isVisible =
            created.status === "approved" || created.status === "completed";
          const matchesFilter =
            !activeCategory || created.category === activeCategory;
          if (isVisible && matchesFilter) {
            setCampaigns((current) => [created, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCategory]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
