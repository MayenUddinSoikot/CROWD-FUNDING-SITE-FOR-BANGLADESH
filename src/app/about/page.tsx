import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Shohay — সহায় সম্পর্কে",
  description:
    "Learn how Shohay works: verified campaigns, 0% platform fee, and secure direct payouts across Bangladesh.",
};

function Section({
  id,
  en,
  bn,
  children,
}: {
  id: string;
  en: string;
  bn: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="text-2xl font-bold">
        {en} · <span className="font-bengali">{bn}</span>
      </h2>
      <div className="mt-3 space-y-4 leading-relaxed opacity-90">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
      <header className="mt-10">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          About Shohay
        </h1>
        <p className="font-bengali mt-1 text-xl opacity-80">সহায় সম্পর্কে</p>
        <p className="mt-4 leading-relaxed opacity-90">
          Shohay is a crowdfunding platform built for Bangladesh — a trusted
          place to raise money for medical care, education, disaster relief,
          and the causes people care about. Every campaign is verified, and we
          charge a 0% platform fee so every taka reaches the people who need it.
        </p>
        <p className="font-bengali mt-3 leading-relaxed opacity-80">
          সহায় বাংলাদেশের জন্য তৈরি একটি ক্রাউডফান্ডিং প্ল্যাটফর্ম — চিকিৎসা,
          শিক্ষা, দুর্যোগ ত্রাণ এবং মানুষের প্রিয় নানা কাজে অর্থ সংগ্রহের একটি
          নির্ভরযোগ্য জায়গা। প্রতিটি ক্যাম্পেইন যাচাই করা হয়, এবং আমরা কোনো
          প্ল্যাটফর্ম ফি নিই না — তাই প্রতিটি টাকা সরাসরি প্রয়োজনে পৌঁছায়।
        </p>
      </header>

      <Section id="how" en="How Shohay works" bn="কীভাবে কাজ করে">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <b>Create a campaign.</b> Share the story, add photos or a video,
            set a goal, and submit for review.
            <span className="font-bengali mt-1 block opacity-80">
              ক্যাম্পেইন তৈরি করুন — গল্প লিখুন, ছবি বা ভিডিও দিন, লক্ষ্য ঠিক করুন
              এবং যাচাইয়ের জন্য জমা দিন।
            </span>
          </li>
          <li>
            <b>We verify it.</b> Our team checks the beneficiary&rsquo;s NID and
            documents before it goes live.
            <span className="font-bengali mt-1 block opacity-80">
              আমরা যাচাই করি — প্রকাশের আগে সুবিধাভোগীর এনআইডি ও কাগজপত্র পরীক্ষা
              করা হয়।
            </span>
          </li>
          <li>
            <b>People donate.</b> Supporters give securely with bKash, Nagad, or
            card and can leave a message.
            <span className="font-bengali mt-1 block opacity-80">
              মানুষ দান করে — বিকাশ, নগদ বা কার্ডে নিরাপদে দান করা যায় এবং বার্তা
              রেখে যাওয়া যায়।
            </span>
          </li>
          <li>
            <b>Funds are paid out.</b> Money reaches the beneficiary or the
            chosen charity directly and transparently.
            <span className="font-bengali mt-1 block opacity-80">
              অর্থ পৌঁছে দেওয়া হয় — টাকা সরাসরি ও স্বচ্ছভাবে সুবিধাভোগী বা
              নির্বাচিত দাতব্য সংস্থায় পৌঁছায়।
            </span>
          </li>
        </ol>
      </Section>

      <Section id="fee" en="0% platform fee" bn="কোনো প্ল্যাটফর্ম ফি নেই">
        <p>
          Shohay does not take a cut of donations. Every taka you give goes to
          the campaign. (Standard payment-gateway charges from bKash, Nagad, or
          the card network still apply, the same as anywhere else.)
        </p>
        <p className="font-bengali opacity-80">
          সহায় দানের কোনো অংশ কেটে রাখে না। আপনার দেওয়া প্রতিটি টাকা ক্যাম্পেইনে
          যায়। (বিকাশ, নগদ বা কার্ড নেটওয়ার্কের সাধারণ লেনদেন ফি সবখানের মতোই
          প্রযোজ্য।)
        </p>
      </Section>

      <Section id="safety" en="Verified & safe" bn="যাচাইকৃত ও নিরাপদ">
        <p>
          Trust is everything. Before a campaign goes live we verify the
          organizer&rsquo;s identity (NID) and supporting documents such as
          medical reports. Occasion fundraisers can only raise for charities
          we&rsquo;ve vetted, and sensitive documents are stored privately —
          visible only to our review team.
        </p>
        <p className="font-bengali opacity-80">
          বিশ্বাসই সবচেয়ে গুরুত্বপূর্ণ। ক্যাম্পেইন প্রকাশের আগে আমরা আয়োজকের পরিচয়
          (এনআইডি) এবং চিকিৎসা রিপোর্টের মতো কাগজপত্র যাচাই করি। উপলক্ষ-ভিত্তিক
          ক্যাম্পেইন শুধু আমাদের যাচাইকৃত দাতব্য সংস্থার জন্যই করা যায়, এবং
          সংবেদনশীল কাগজপত্র গোপনে সংরক্ষণ করা হয় — শুধু আমাদের যাচাই দল দেখতে
          পায়।
        </p>
      </Section>

      <div className="mt-12 rounded-2xl border border-foreground/10 bg-card p-6 text-center">
        <p className="font-semibold">Have a question?</p>
        <p className="mt-1 text-sm opacity-70">
          Find answers on our FAQ, in Bangla and English.
        </p>
        <Link
          href="/faq"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Read the FAQ · <span className="font-bengali">প্রশ্নোত্তর</span>
        </Link>
      </div>
    </main>
  );
}
