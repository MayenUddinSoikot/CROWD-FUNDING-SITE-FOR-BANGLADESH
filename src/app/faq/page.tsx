import type { Metadata } from "next";
import { getSiteContent, text } from "@/lib/site-content";
import { Prose } from "@/components/Prose";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Shohay সহায়",
  description: "Frequently asked questions about Shohay, in Bangla and English.",
};

const FAQS: { q_en: string; q_bn: string; a_en: string; a_bn: string }[] = [
  {
    q_en: "What is Shohay?",
    q_bn: "সহায় কী?",
    a_en: "Shohay is a crowdfunding platform for Bangladesh where anyone can raise or donate money for medical, education, disaster relief, occasions like birthdays, or to support creators.",
    a_bn: "সহায় বাংলাদেশের একটি ক্রাউডফান্ডিং প্ল্যাটফর্ম, যেখানে যে কেউ চিকিৎসা, শিক্ষা, দুর্যোগ ত্রাণ, জন্মদিনের মতো উপলক্ষ, বা ক্রিয়েটরদের সহায়তার জন্য অর্থ সংগ্রহ বা দান করতে পারে।",
  },
  {
    q_en: "How much does Shohay charge?",
    q_bn: "সহায় কত ফি নেয়?",
    a_en: "Shohay charges a 0% platform fee. Only the standard payment-gateway charges (bKash, Nagad, or card networks) apply.",
    a_bn: "সহায় কোনো প্ল্যাটফর্ম ফি নেয় না (০%)। শুধু বিকাশ, নগদ বা কার্ড নেটওয়ার্কের সাধারণ লেনদেন ফি প্রযোজ্য।",
  },
  {
    q_en: "How do I know a campaign is genuine?",
    q_bn: "একটি ক্যাম্পেইন আসল কিনা কীভাবে বুঝব?",
    a_en: "Every campaign is reviewed by our team, who verify the organizer's NID and supporting documents before it can go live.",
    a_bn: "প্রতিটি ক্যাম্পেইন আমাদের দল যাচাই করে — প্রকাশের আগে আয়োজকের এনআইডি ও প্রয়োজনীয় কাগজপত্র পরীক্ষা করা হয়।",
  },
  {
    q_en: "How can I donate?",
    q_bn: "কীভাবে দান করব?",
    a_en: "Open any campaign, tap Donate, choose an amount, and pay with bKash, Nagad, or card. You can add a short message and give anonymously if you wish.",
    a_bn: "যেকোনো ক্যাম্পেইন খুলে Donate-এ চাপুন, পরিমাণ বেছে নিন এবং বিকাশ, নগদ বা কার্ডে দিন। চাইলে ছোট বার্তা যোগ করতে ও নাম গোপন রাখতে পারেন।",
  },
  {
    q_en: "Can I raise money for a charity on my birthday?",
    q_bn: "জন্মদিনে দাতব্য সংস্থার জন্য অর্থ সংগ্রহ করতে পারি?",
    a_en: "Yes. Choose an 'Occasion fundraiser', pick one or more verified charities, and split the percentage. Funds go directly to those charities.",
    a_bn: "হ্যাঁ। 'উপলক্ষ ক্যাম্পেইন' বেছে নিন, এক বা একাধিক যাচাইকৃত দাতব্য সংস্থা নির্বাচন করুন এবং শতাংশ ভাগ করুন। অর্থ সরাসরি সেই সংস্থাগুলোতে যায়।",
  },
  {
    q_en: "Who receives the money?",
    q_bn: "টাকা কে পায়?",
    a_en: "For a normal campaign, the verified beneficiary. For an occasion fundraiser, the chosen charities. For a creator page, the creator themselves.",
    a_bn: "সাধারণ ক্যাম্পেইনে যাচাইকৃত সুবিধাভোগী। উপলক্ষ ক্যাম্পেইনে নির্বাচিত দাতব্য সংস্থা। ক্রিয়েটর পেজে ক্রিয়েটর নিজে।",
  },
  {
    q_en: "Is my personal information safe?",
    q_bn: "আমার ব্যক্তিগত তথ্য কি নিরাপদ?",
    a_en: "Yes. Sensitive documents like NID and medical reports are stored privately and are visible only to our review team — never shown publicly.",
    a_bn: "হ্যাঁ। এনআইডি ও মেডিকেল রিপোর্টের মতো সংবেদনশীল কাগজপত্র গোপনে সংরক্ষণ করা হয় এবং শুধু আমাদের যাচাই দল দেখতে পায় — কখনো প্রকাশ্যে দেখানো হয় না।",
  },
  {
    q_en: "How do I contact Shohay?",
    q_bn: "সহায়ের সাথে কীভাবে যোগাযোগ করব?",
    a_en: "Reach out through our support channels — we reply in both Bangla and English. (Contact details coming soon.)",
    a_bn: "আমাদের সাপোর্ট চ্যানেলে যোগাযোগ করুন — আমরা বাংলা ও ইংরেজি উভয় ভাষায় উত্তর দিই। (যোগাযোগের বিস্তারিত শীঘ্রই আসছে।)",
  },
];

export default async function FaqPage() {
  /* Written in /admin/content. Empty means "keep the page as
     built", so nothing here has to be re-typed to keep it. */
  const content = await getSiteContent();
  const customTitle = text(content, "faq.title").trim();
  const customBody = text(content, "faq.body").trim();
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
      <header className="mt-10">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          Help &amp; FAQ
        </h1>
        <p className="font-bengali mt-1 text-xl opacity-80">
          সহায়তা ও প্রশ্নোত্তর
        </p>
        <p className="mt-4 opacity-80">
          Answers to common questions, in English and Bangla.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q_en}
            className="group rounded-2xl border border-foreground/10 bg-card p-5"
          >
            <summary className="cursor-pointer list-none font-semibold">
              <span className="flex items-start justify-between gap-3">
                <span>
                  {item.q_en}
                  <span className="font-bengali block text-sm font-normal opacity-70">
                    {item.q_bn}
                  </span>
                </span>
                <span className="shrink-0 opacity-40 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-relaxed opacity-90">
              <p>{item.a_en}</p>
              <p className="font-bengali opacity-80">{item.a_bn}</p>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-10 text-sm">
        <Link href="/about" className="opacity-60 hover:text-brand">
          ← About Shohay
        </Link>
      </div>
    </main>
  );
}
