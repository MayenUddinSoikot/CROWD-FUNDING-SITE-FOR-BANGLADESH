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
