"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type GoalState = { error?: string; saved?: boolean } | undefined;

export async function updateGoal(
  _prev: GoalState,
  formData: FormData
): Promise<GoalState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const goal = Number(formData.get("goal_amount"));

  if (!campaignId || !Number.isFinite(goal) || goal <= 0) {
    return { error: "Enter a valid goal amount." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // SECURITY DEFINER function: can only change the goal of your own
  // campaign — nothing else. Defined in supabase/campaigner-tools.sql.
  const { error } = await supabase.rpc("update_my_goal", {
    campaign: campaignId,
    new_goal: goal,
  });

  if (error) {
    console.error("Goal update failed:", error.message);
    return {
      error:
        "Could not update the goal. If this keeps happening, the campaigner-tools.sql script may not have been run yet.",
    };
  }

  revalidatePath(`/account/campaigns/${campaignId}`);
  revalidatePath("/account");
  return { saved: true };
}
