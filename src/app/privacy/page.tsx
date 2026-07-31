import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy — Shohay সহায়" };

export default function PrivacyPage() {
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
