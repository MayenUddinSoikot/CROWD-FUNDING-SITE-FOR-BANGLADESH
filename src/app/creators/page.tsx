import type { Metadata } from "next";
import { BrowseCampaigns } from "@/components/BrowseCampaigns";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Support a creator — Shohay সহায়",
  description:
    "Back Bangladeshi creators with monthly support or a one-off cha. 0% platform fee.",
};

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  return (
    <BrowseCampaigns
      q={q}
      filter="creators"
      lockedFilter
      category={category}
      basePath="/creators"
      heading="Support a creator"
      headingBn="ক্রিয়েটরকে সাপোর্ট করুন"
      intro="Back the people making work you love — buy them a cha, or support them every month."
    />
  );
}
