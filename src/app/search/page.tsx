import type { Metadata } from "next";
import { BrowseCampaigns } from "@/components/BrowseCampaigns";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search campaigns — Shohay সহায়" };

export default async function SearchPage({
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
      basePath="/search"
      heading="Find a campaign"
      headingBn="ক্যাম্পেইন খুঁজুন"
    />
  );
}
