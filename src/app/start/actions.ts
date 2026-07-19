"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { CampaignCategory } from "@/lib/types";

export type CreateCampaignState = { error?: string } | undefined;

export async function createCampaign(
  _prevState: CreateCampaignState,
  formData: FormData
): Promise<CreateCampaignState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in again." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const titleBn = String(formData.get("title_bn") ?? "").trim();
  const category = String(formData.get("category") ?? "") as CampaignCategory;
  const goalAmount = Number(formData.get("goal_amount"));
  const beneficiaryName = String(formData.get("beneficiary_name") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const summaryBn = String(formData.get("summary_bn") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const storyBn = String(formData.get("story_bn") ?? "").trim();

  if (!title || !category || !goalAmount || goalAmount <= 0) {
    return {
      error: "Please fill in the title, category, and a goal amount above 0.",
    };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      slug: slugify(title),
      title,
      title_bn: titleBn || null,
      category,
      goal_amount: goalAmount,
      beneficiary_name: beneficiaryName || null,
      district: district || null,
      summary: summary || null,
      summary_bn: summaryBn || null,
      story: story || null,
      story_bn: storyBn || null,
      creator_id: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create campaign:", error.message);
    return { error: "Something went wrong saving the campaign. Try again." };
  }

  redirect(`/account?created=${data.id}`);
}
