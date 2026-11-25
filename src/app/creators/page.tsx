import type { Metadata } from "next";
import { getCreators } from "@/lib/creators";
import { CreatorCard } from "@/components/CreatorCard";
import { EmptyState, ButtonLink, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Creators — Shohay সহায়",
  description:
    "The people raising money for Bangladesh. Support them monthly, or buy them a cha. 0% platform fee.",
};

export default async function CreatorsPage() {
  const creators = await getCreators(60);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        title="Creators raising for Bangladesh"
        bn="যাঁরা সাহায্য তুলছেন"
      >
        <ButtonLink href="/setup" size="sm">
          Create your page
        </ButtonLink>
      </SectionHeading>

      <p className="mt-3 max-w-2xl leading-relaxed text-body">
        Back the people doing the asking — support them every month, or buy
        them a cha. Shohay takes 0%.
      </p>

      {creators.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No creator pages yet"
            bn="এখনও কোনো ক্রিয়েটর পেজ নেই"
            hint="Be the first. Build a page, bring the people who already follow you, and raise for someone who needs it."
            action={<ButtonLink href="/setup">Create your page</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </main>
  );
}
