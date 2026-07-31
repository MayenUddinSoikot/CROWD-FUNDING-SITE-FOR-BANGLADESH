import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms — Shohay সহায়" };

export default function TermsPage() {
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
