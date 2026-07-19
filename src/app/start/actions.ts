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
  const coverImageUrl = String(formData.get("cover_image_url") ?? "").trim();

  if (!title || !category || !goalAmount || goalAmount <= 0) {
    return {
      error: "Please fill in the title, category, and a goal amount above 0.",
    };
  }

  if (coverImageUrl && !/^https:\/\/\S+$/.test(coverImageUrl)) {
    return { error: "The cover image link must start with https://" };
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
      cover_image_url: coverImageUrl || null,
      creator_id: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create campaign:", error.message);
    return { error: "Something went wrong saving the campaign. Try again." };
  }

  // Private verification + payout details, stored in a separate table that
  // has no public read policy. Optional — only saved if the applicant
  // filled any of it in.
  const verification = {
    campaign_id: data.id,
    applicant_name: str(formData, "applicant_name"),
    applicant_nid: str(formData, "applicant_nid"),
    applicant_phone: str(formData, "applicant_phone"),
    applicant_email: str(formData, "applicant_email"),
    relationship: str(formData, "relationship"),
    bank_name: str(formData, "bank_name"),
    bank_branch: str(formData, "bank_branch"),
    bank_account_name: str(formData, "bank_account_name"),
    bank_account_number: str(formData, "bank_account_number"),
    bkash_number: str(formData, "bkash_number"),
    notes: str(formData, "notes"),
  };

  const hasVerification = Object.entries(verification).some(
    ([key, value]) => key !== "campaign_id" && value !== null
  );

  if (hasVerification) {
    const { error: vError } = await supabase
      .from("campaign_verifications")
      .insert(verification);
    if (vError) {
      // Don't fail the whole submission — the campaign is already saved.
      console.error("Failed to save verification:", vError.message);
    }
  }

  redirect(`/account?created=${data.id}`);
}

function str(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}
