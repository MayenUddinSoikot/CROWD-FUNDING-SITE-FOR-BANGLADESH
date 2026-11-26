import type { Metadata } from "next";
import { getSiteContent, text } from "@/lib/site-content";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy — Shohay সহায়" };

export default async function PrivacyPage() {
  /* Written in /admin/content. Empty means "keep the page as
     built", so nothing here has to be re-typed to keep it. */
  const content = await getSiteContent();
  const customTitle = text(content, "privacy.title").trim();
  const customBody = text(content, "privacy.body").trim();
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
      <h1 className="mt-10 font-serif text-3xl font-bold">Privacy Notice</h1>
      <p className="font-bengali mt-1 text-lg opacity-80">গোপনীয়তা নীতি</p>
      <p className="mt-6 leading-relaxed opacity-90">
        This is a placeholder privacy notice for Shohay. Sensitive documents
        like NID and medical reports are stored privately and shown only to our
        review team. A full privacy notice will be published here before launch.
      </p>
      <p className="font-bengali mt-3 leading-relaxed opacity-80">
        এটি সহায়ের একটি খসড়া গোপনীয়তা নীতি। এনআইডি ও মেডিকেল রিপোর্টের মতো
        সংবেদনশীল কাগজপত্র গোপনে সংরক্ষণ করা হয় এবং শুধু আমাদের যাচাই দল দেখতে
        পায়। চালুর আগে সম্পূর্ণ গোপনীয়তা নীতি এখানে প্রকাশ করা হবে।
      </p>
    </main>
  );
}
