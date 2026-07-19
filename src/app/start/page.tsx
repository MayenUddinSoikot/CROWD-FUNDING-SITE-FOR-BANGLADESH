import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SiteHeader } from "@/components/SiteHeader";
import { CampaignWizard } from "./CampaignWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Start a campaign — Shohay সহায়",
};

export default async function StartCampaignPage() {
  let isLoggedIn = false;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  if (!isLoggedIn) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
            ক্যাম্পেইন শুরু করুন
          </h1>
          <p className="mt-2 text-xl font-semibold">Start a campaign</p>
          <p className="mt-6 max-w-md leading-relaxed opacity-70">
            Log in to open the campaign wizard. Every campaign is personally
            verified before going live — 0% platform fee, direct payout.
          </p>
          <Link
            href="/login"
            className="mt-10 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Log in to continue
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
          ক্যাম্পেইন শুরু করুন
        </h1>
        <p className="mt-2 text-xl font-semibold">Start a campaign</p>
        <CampaignWizard />
      </main>
    </>
  );
}
