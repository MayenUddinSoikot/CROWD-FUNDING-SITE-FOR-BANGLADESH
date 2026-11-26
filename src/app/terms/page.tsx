import type { Metadata } from "next";
import { getSiteContent, text } from "@/lib/site-content";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms — Shohay সহায়" };

export default async function TermsPage() {
  /* Written in /admin/content. Empty means "keep the page as
     built", so nothing here has to be re-typed to keep it. */
  const content = await getSiteContent();
  const customTitle = text(content, "terms.title").trim();
  const customBody = text(content, "terms.body").trim();
  if (customBody) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        {customTitle ? (
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {customTitle}
          </h1>
        ) : null}
        <Prose text={customBody} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
      <h1 className="mt-10 font-serif text-3xl font-bold">Terms of Use</h1>
      <p className="font-bengali mt-1 text-lg opacity-80">ব্যবহারের শর্তাবলী</p>
      <p className="mt-6 leading-relaxed opacity-90">
        These are placeholder terms for Shohay. Full terms of use — covering
        campaigns, donations, payouts, and acceptable use — will be published
        here before launch.
      </p>
      <p className="font-bengali mt-3 leading-relaxed opacity-80">
        এটি সহায়ের একটি খসড়া শর্তাবলী। ক্যাম্পেইন, দান, পেআউট ও ব্যবহারবিধি
        সম্পর্কিত সম্পূর্ণ শর্তাবলী চালুর আগে এখানে প্রকাশ করা হবে।
      </p>
    </main>
  );
}
