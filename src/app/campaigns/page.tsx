import type { Metadata } from "next";
import { BrowseCampaigns } from "@/components/BrowseCampaigns";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse campaigns — Shohay সহায়",
  description:
    "Browse verified fundraisers across Bangladesh — medical, education, disaster relief and more.",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; category?: string }>;
}) {
  const { q, filter, category } = await searchParams;
  return (
    <BrowseCampaigns
      q={q}
      filter={filter}
      category={category}
      basePath="/campaigns"
      heading="Browse campaigns"
      headingBn="সব ক্যাম্পেইন"
    />
  );
}
