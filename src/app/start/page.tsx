import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PublicCharity } from "@/lib/types";
import { CampaignWizard } from "./CampaignWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Start a campaign — Shohay সহায়",
};

export default async function StartCampaignPage() {
  let userId: string | null = null;
  let charities: PublicCharity[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const { data } = await supabase
      .from("public_charities")
      .select("id, name, description, logo_url")
      .order("name");
    charities = (data as PublicCharity[]) ?? [];
  }

  if (!userId) {
    return (
      <>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
            ক্যাম্পেইন শুরু করুন
          </h1>
          <p className="mt-2 text-xl font-semibold">Start a campaign</p>
          <p className="mt-6 max-w-md leading-relaxed text-body">
            Create a free account to open the campaign form. Every campaign is
            checked by our internal verification team before going live — 0%
            platform fee, direct payout.
          </p>
          <Link
            href="/signup"
            className="press mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-brand px-7 text-lg font-bold text-white shadow-brand hover:bg-brand-dark"
          >
            Create a free account
          </Link>
          <p className="mt-4 text-sm text-muted">
            Already have one?{" "}
            <Link href="/login" className="font-bold text-brand">
              Log in
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
          ক্যাম্পেইন শুরু করুন
        </h1>
        <p className="mt-2 text-xl font-semibold">Start a campaign</p>
        <CampaignWizard userId={userId} charities={charities} />
      </main>
    </>
  );
}
