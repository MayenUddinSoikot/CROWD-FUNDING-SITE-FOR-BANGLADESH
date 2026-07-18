import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Start a campaign — Shohay সহায়",
};

export default function StartCampaignPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
          ক্যাম্পেইন শুরু করুন
        </h1>
        <p className="mt-2 text-xl font-semibold">Start a campaign</p>
        <p className="mt-6 max-w-md leading-relaxed opacity-70">
          The campaign wizard is opening very soon. Every campaign is
          personally verified before going live — 0% platform fee, direct
          payout.
        </p>
        <p className="font-bengali mt-2 max-w-md leading-relaxed opacity-70">
          ক্যাম্পেইন তৈরির সুবিধা শীঘ্রই চালু হচ্ছে। প্রতিটি ক্যাম্পেইন যাচাই
          করে প্রকাশ করা হয়।
        </p>
        <Link
          href="/"
          className="mt-10 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Browse campaigns · <span className="font-bengali">ক্যাম্পেইন দেখুন</span>
        </Link>
      </main>
    </>
  );
}
