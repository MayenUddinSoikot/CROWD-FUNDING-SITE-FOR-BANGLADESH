"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { CampaignCategory } from "@/lib/types";
import { RELATIONSHIP_LABELS, OCCASION_LABELS } from "@/lib/types";

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
  const media = parseMedia(formData.get("media"));
  const firstPhoto = media.find((m) => m.type === "image")?.url ?? null;
  const durationDays = Number(formData.get("duration_days"));
  const organizerName = String(formData.get("organizer_name") ?? "").trim();
  const organizerRelationship = String(
    formData.get("organizer_relationship") ?? ""
  ).trim();
  const applicantName = String(formData.get("applicant_name") ?? "").trim();
  const applicantNid = String(formData.get("applicant_nid") ?? "").trim();
  const applicantPhone = String(formData.get("applicant_phone") ?? "").trim();
  const documents = parseDocuments(formData.get("documents"));
  const campaignType =
    String(formData.get("campaign_type") ?? "") === "creator"
      ? "creator"
      : "standard";
  const occasionRaw = String(formData.get("occasion") ?? "").trim();
  const occasion =
    campaignType === "standard" && occasionRaw in OCCASION_LABELS
      ? occasionRaw
      : null;
  const creatorMode =
    String(formData.get("creator_mode") ?? "") === "project"
      ? "project"
      : "monthly";
  const socialLinks =
    campaignType === "creator" ? parseSocialLinks(formData) : null;

  // Every required field must be filled — mirrors the form's required marks
  // and blocks incomplete submissions even if the browser check is bypassed.
  const missing =
    !title ||
    !category ||
    !goalAmount ||
    goalAmount <= 0 ||
    !beneficiaryName ||
    !district ||
    !organizerName ||
    !organizerRelationship ||
    !summary ||
    !story ||
    !applicantName ||
    !applicantNid ||
    !applicantPhone;

  if (missing) {
    return {
      error:
        "Please complete all required fields (marked *) before submitting.",
    };
  }

  if (!firstPhoto) {
    return { error: "Please add at least one photo of the campaign." };
  }

  if (!documents.some((d) => d.docType === "nid")) {
    return {
      error:
        "Please upload one government ID — NID, Passport or Birth certificate — in the Documents section.",
    };
  }

  // Occasion fundraisers must pick verified charities that sum to 100%.
  const charityAllocations = parseCharities(formData.get("charities"));
  if (occasion) {
    const total = charityAllocations.reduce((s, c) => s + c.percentage, 0);
    if (charityAllocations.length === 0 || Math.round(total) !== 100) {
      return {
        error:
          "Choose one or more charities whose shares add up to 100%.",
      };
    }
  }

  // Duration & recurring logic.
  const allowedDurations = new Set([7, 14, 30, 60, 90]);
  const days = allowedDurations.has(durationDays) ? durationDays : 30;
  const dayMs = 24 * 60 * 60 * 1000;

  let endsAt: string | null;
  let isRecurring = false;
  let cycleAnchor: string | null = null;

  if (campaignType === "creator") {
    if (creatorMode === "monthly") {
      // Ongoing, resets every 30 days.
      isRecurring = true;
      cycleAnchor = new Date().toISOString();
      endsAt = null;
    } else {
      // Special project — capped at 30 days.
      const projectDays = Math.min(days, 30);
      endsAt = new Date(Date.now() + projectDays * dayMs).toISOString();
    }
  } else {
    endsAt = new Date(Date.now() + days * dayMs).toISOString();
  }

  const allowedRelationships = new Set(Object.keys(RELATIONSHIP_LABELS));
  const relationship = allowedRelationships.has(organizerRelationship)
    ? organizerRelationship
    : null;

  const row: Record<string, unknown> = {
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
    cover_image_url: firstPhoto,
    organizer_name: organizerName || null,
    organizer_relationship: relationship,
    campaign_type: campaignType,
    occasion,
    is_recurring: isRecurring,
    cycle_anchor: cycleAnchor,
    ends_at: endsAt,
    creator_id: user.id,
    status: "pending",
  };
  if (socialLinks) row.social_links = socialLinks;

  const { data, error, dropped } = await insertCampaign(supabase, row);

  if (dropped.length > 0) {
    console.warn(
      `Campaign saved without these columns (run the matching SQL script): ${dropped.join(", ")}`
    );
  }

  if (error || !data) {
    if (error) console.error("Failed to create campaign:", error.message, error.code);
    return {
      error: error
        ? describeSaveError(error)
        : "Could not save the campaign. Nothing you typed has been lost — please try again.",
    };
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
    relationship: relationship ? RELATIONSHIP_LABELS[relationship] : null,
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

  // Charity split for occasion fundraisers.
  if (occasion && charityAllocations.length > 0) {
    const { error: cError } = await supabase.from("campaign_charities").insert(
      charityAllocations.map((c) => ({
        campaign_id: data.id,
        charity_id: c.charity_id,
        percentage: c.percentage,
      }))
    );
    if (cError) console.error("Failed to save charities:", cError.message);
  }

  // Public gallery media (photos + video / YouTube), already uploaded to
  // the public bucket from the browser.
  if (media.length > 0) {
    const { error: mError } = await supabase.from("campaign_media").insert(
      media.map((m) => ({
        campaign_id: data.id,
        media_type: m.type,
        url: m.url,
        position: m.position,
      }))
    );
    if (mError) console.error("Failed to save media:", mError.message);
  }

  // Documents were already uploaded to the private vault from the browser;
  // here we just record which files belong to this campaign.
  if (documents.length > 0) {
    const { error: dError } = await supabase.from("campaign_documents").insert(
      documents.map((doc) => ({
        campaign_id: data.id,
        doc_type: doc.docType,
        storage_path: doc.path,
        file_name: doc.fileName,
      }))
    );
    if (dError) console.error("Failed to save documents:", dError.message);
  }

  redirect(`/account?created=${data.id}`);
}

type DbError = { message: string; code?: string };
type SupabaseLike = Awaited<ReturnType<typeof createServerSupabaseClient>>;

// Columns that only exist after a later SQL script has been run. If the
// database doesn't have one yet, drop it and save the rest rather than
// failing the whole submission and losing everything they typed.
const OPTIONAL_COLUMNS = new Set([
  "social_links",
  "is_recurring",
  "cycle_anchor",
  "occasion",
  "campaign_type",
  "organizer_name",
  "organizer_relationship",
]);

function missingColumnFrom(error: DbError): string | null {
  if (error.code !== "42703") return null;
  const match = /column "([^"]+)"/.exec(error.message);
  return match ? match[1] : null;
}

async function insertCampaign(
  supabase: SupabaseLike,
  row: Record<string, unknown>
): Promise<{
  data: { id: string } | null;
  error: DbError | null;
  dropped: string[];
}> {
  const payload = { ...row };
  const dropped: string[] = [];

  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.size; attempt++) {
    const { data, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select("id")
      .single();

    if (!error) return { data: data as { id: string }, error: null, dropped };

    const missing = missingColumnFrom(error);
    if (!missing || !OPTIONAL_COLUMNS.has(missing) || !(missing in payload)) {
      return { data: null, error, dropped };
    }
    delete payload[missing];
    dropped.push(missing);
  }

  return {
    data: null,
    error: { message: "Too many missing columns", code: "42703" },
    dropped,
  };
}

function describeSaveError(error: DbError): string {
  if (error.code === "23505") {
    return "A campaign with this title already exists. Change the title slightly and submit again.";
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    return "Your login session expired. Open the site in a new tab, log in again, then submit.";
  }
  const missing = missingColumnFrom(error);
  if (missing) {
    return `The database is missing the "${missing}" field — an admin needs to run the matching SQL script in Supabase. Nothing you typed has been lost.`;
  }
  return `Could not save the campaign: ${error.message}. Nothing you typed has been lost — please try again.`;
}

type UploadedDoc = { docType: string; path: string; fileName: string };

const ALLOWED_DOC_TYPES = new Set(["nid", "medical", "cheque", "other"]);

function parseDocuments(raw: FormDataEntryValue | null): UploadedDoc[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (d): d is UploadedDoc =>
          d &&
          typeof d.path === "string" &&
          typeof d.fileName === "string" &&
          typeof d.docType === "string" &&
          ALLOWED_DOC_TYPES.has(d.docType)
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

const SOCIAL_KEYS = ["facebook", "instagram", "youtube", "tiktok"] as const;

// Only well-formed https links are kept; null when none were given.
function parseSocialLinks(formData: FormData): Record<string, string> | null {
  const links: Record<string, string> = {};
  for (const key of SOCIAL_KEYS) {
    const value = String(formData.get(`social_${key}`) ?? "").trim();
    if (value && /^https:\/\/\S+$/.test(value) && value.length <= 300) {
      links[key] = value;
    }
  }
  return Object.keys(links).length > 0 ? links : null;
}

function str(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

type CharityAlloc = { charity_id: string; percentage: number };

function parseCharities(raw: FormDataEntryValue | null): CharityAlloc[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is CharityAlloc =>
          c &&
          typeof c.charity_id === "string" &&
          c.charity_id.length > 0 &&
          Number.isFinite(Number(c.percentage))
      )
      .map((c) => ({ charity_id: c.charity_id, percentage: Number(c.percentage) }))
      .slice(0, 10);
  } catch {
    return [];
  }
}

type MediaItem = { type: "image" | "video" | "youtube"; url: string; position: number };

const ALLOWED_MEDIA_TYPES = new Set(["image", "video", "youtube"]);

function parseMedia(raw: FormDataEntryValue | null): MediaItem[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is MediaItem =>
          m &&
          typeof m.url === "string" &&
          /^https?:\/\//.test(m.url) &&
          typeof m.type === "string" &&
          ALLOWED_MEDIA_TYPES.has(m.type)
      )
      .slice(0, 6)
      .map((m, i) => ({ ...m, position: Number(m.position) || i }));
  } catch {
    return [];
  }
}
