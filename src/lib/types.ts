export type CampaignCategory =
  | "medical"
  | "education"
  | "disaster_relief"
  | "community"
  | "other";

export type Campaign = {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  summary: string | null;
  summary_bn: string | null;
  story: string | null;
  story_bn: string | null;
  category: CampaignCategory;
  goal_amount: number;
  raised_amount: number;
  status: "draft" | "pending" | "approved" | "rejected" | "completed";
  cover_image_url: string | null;
  beneficiary_name: string | null;
  district: string | null;
  ends_at: string | null;
  created_at: string;
};

export type CampaignVerification = {
  campaign_id: string;
  applicant_name: string | null;
  applicant_nid: string | null;
  applicant_phone: string | null;
  applicant_email: string | null;
  relationship: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bkash_number: string | null;
  notes: string | null;
  created_at: string;
};

export type DocType = "nid" | "medical" | "cheque" | "other";

export type CampaignDocument = {
  id: string;
  campaign_id: string;
  doc_type: DocType;
  storage_path: string;
  file_name: string | null;
  created_at: string;
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  nid: "NID (national ID)",
  medical: "Medical report",
  cheque: "Bank cheque / statement",
  other: "Other document",
};

export type PublicDonation = {
  id: string;
  campaign_id: string;
  donor_name: string | null;
  amount: number;
  message: string | null;
  paid_at: string | null;
};

export const CATEGORY_LABELS: Record<
  CampaignCategory,
  { en: string; bn: string; emoji: string }
> = {
  medical: { en: "Medical", bn: "চিকিৎসা", emoji: "🏥" },
  education: { en: "Education", bn: "শিক্ষা", emoji: "📚" },
  disaster_relief: { en: "Disaster Relief", bn: "দুর্যোগ ত্রাণ", emoji: "🌊" },
  community: { en: "Community", bn: "কমিউনিটি", emoji: "🤝" },
  other: { en: "Other", bn: "অন্যান্য", emoji: "💚" },
};
