export type CampaignCategory =
  | "medical"
  | "emergency"
  | "education"
  | "disaster_relief"
  | "community"
  | "creator"
  | "arts"
  | "religious"
  | "animal"
  | "environment"
  | "sports"
  | "memorial"
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
  status: "draft" | "pending" | "approved" | "rejected" | "completed" | "frozen";
  cover_image_url: string | null;
  video_url: string | null;
  beneficiary_name: string | null;
  organizer_name: string | null;
  organizer_relationship: string | null;
  district: string | null;
  campaign_type: string; // 'standard' | 'creator'
  occasion: string | null;
  is_recurring: boolean;
  cycle_days: number;
  cycle_anchor: string | null;
  ends_at: string | null;
  created_at: string;
  creator_id?: string | null;
  social_links?: Record<string, string> | null;
  campaign_no?: number | null;
};

// Social platforms a creator can link on their page and fundraisers.
export const SOCIAL_PLATFORMS: {
  key: string;
  label: string;
  emoji: string;
  color: string;
  placeholder: string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    emoji: "📘",
    color: "bg-[#1877F2]",
    placeholder: "https://facebook.com/yourpage",
  },
  {
    key: "instagram",
    label: "Instagram",
    emoji: "📸",
    color: "bg-[#E4405F]",
    placeholder: "https://instagram.com/yourhandle",
  },
  {
    key: "youtube",
    label: "YouTube",
    emoji: "▶️",
    color: "bg-[#FF0000]",
    placeholder: "https://youtube.com/@yourchannel",
  },
  {
    key: "tiktok",
    label: "TikTok",
    emoji: "🎵",
    color: "bg-black",
    placeholder: "https://tiktok.com/@yourhandle",
  },
];

// Optional special-occasion tag shown publicly on a campaign.
export const OCCASION_LABELS: Record<
  string,
  { label: string; emoji: string }
> = {
  birthday: { label: "Birthday", emoji: "🎂" },
  wedding: { label: "Wedding", emoji: "💍" },
  anniversary: { label: "Anniversary", emoji: "💐" },
  memorial: { label: "In memory", emoji: "🕊️" },
  eid: { label: "Eid / religious", emoji: "🌙" },
  other: { label: "Special occasion", emoji: "🎉" },
};

// Public: how the organizer relates to the beneficiary. Shown to donors.
export const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Raising for myself",
  family: "Family",
  friend: "Friend",
  well_wisher: "Well-wisher",
  neighbour: "Neighbour",
  colleague: "Colleague",
  organization: "Organization / community",
  other: "Other",
};

export type CampaignUpdate = {
  id: string;
  campaign_id: string;
  body: string;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  excerpt: string | null;
  body: string | null;
  body_bn: string | null;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
};

export type PublicCreator = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links?: Record<string, string> | null;
};

export type PublicCharity = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
};

export type CampaignCharity = {
  id: string;
  campaign_id: string;
  charity_id: string;
  percentage: number;
};

export type MediaType = "image" | "video" | "youtube";

// Photos and videos Shohay itself places on the site (homepage hero,
// featured strip). Managed from Admin → Homepage media.
export type SiteMedia = {
  id: string;
  slot: string;
  media_type: MediaType;
  url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  position: number;
  published: boolean;
};

export type CampaignMedia = {
  id: string;
  campaign_id: string;
  media_type: MediaType;
  url: string;
  position: number;
};

// Turn any YouTube URL into an embeddable one; null if not YouTube.
export function youtubeEmbedUrl(url: string): string | null {
  const match =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      url
    );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

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
  nid: "Government ID (NID / Passport / Birth certificate)",
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
  emergency: { en: "Emergency", bn: "জরুরি", emoji: "🚨" },
  education: { en: "Education", bn: "শিক্ষা", emoji: "📚" },
  disaster_relief: { en: "Disaster Relief", bn: "দুর্যোগ ত্রাণ", emoji: "🌊" },
  community: { en: "Community", bn: "কমিউনিটি", emoji: "🤝" },
  creator: { en: "Creator / content", bn: "ক্রিয়েটর", emoji: "🎥" },
  arts: { en: "Arts & music", bn: "শিল্প ও সংগীত", emoji: "🎨" },
  religious: { en: "Religious", bn: "ধর্মীয়", emoji: "🕌" },
  animal: { en: "Animals", bn: "প্রাণী", emoji: "🐾" },
  environment: { en: "Environment", bn: "পরিবেশ", emoji: "🌱" },
  sports: { en: "Sports", bn: "খেলাধুলা", emoji: "🏆" },
  memorial: { en: "Memorial", bn: "স্মরণে", emoji: "🕊️" },
  other: { en: "Other", bn: "অন্যান্য", emoji: "💚" },
};
