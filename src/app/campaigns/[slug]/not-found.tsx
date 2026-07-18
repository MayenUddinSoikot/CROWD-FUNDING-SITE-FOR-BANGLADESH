import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function CampaignNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Campaign not found</h1>
        <p className="font-bengali mt-2 opacity-70">ক্যাম্পেইনটি পাওয়া যায়নি</p>
        <p className="mt-4 max-w-md text-sm opacity-60">
          It may have ended or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Back to all campaigns
        </Link>
      </main>
    </>
  );
}
