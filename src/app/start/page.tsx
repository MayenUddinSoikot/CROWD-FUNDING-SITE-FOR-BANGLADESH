import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PublicCharity } from "@/lib/types";
import { accountKind, isAccountKind } from "@/lib/account-kind";
import type { AccountKind } from "@/lib/account-kind";
import { CampaignWizard } from "./CampaignWizard";
import { KindPicker } from "./KindPicker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Start a campaign — Shohay সহায়",
};

/* What we already hold about this person, so the form stops asking
   for it a second time. Only ever the last four digits leave the
   server — enough for them to recognise which ID we mean. */
export type KnownDetails = {
  name: string;
  nidTail: string;
  phoneTail: string;
  payout: string | null;
  hasIdDocument: boolean;
};

function tail(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\s+/g, "");
  return digits.length > 4 ? digits.slice(-4) : digits;
}

export default async function StartCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; again?: string }>;
}) {
  const { kind: kindParam, again } = await searchParams;

  let userId: string | null = null;
  let charities: PublicCharity[] = [];
  let savedKind: AccountKind | null = null;
  let profileName = "";
  let known: KnownDetails | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const charityQuery = supabase
      .from("public_charities")
      .select("id, name, description, logo_url")
      .order("name");

    if (!userId) {
      const { data } = await charityQuery;
      charities = (data as PublicCharity[]) ?? [];
    } else {
      // Row-level security limits both of these to this person's own
      // campaigns, so a previous submission is the only thing they can
      // reuse.
      const [charityResult, profileResult, verificationResult, documentResult] =
        await Promise.all([
          charityQuery,
          supabase
            .from("profiles")
            .select("account_kind, display_name, full_name")
            .eq("id", user!.id)
            .maybeSingle(),
          supabase
            .from("campaign_verifications")
            .select(
              "applicant_name, applicant_nid, applicant_phone, bkash_number, bank_name, bank_account_number, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("campaign_documents")
            .select("id")
            .eq("doc_type", "nid")
            .limit(1),
        ]);

      charities = (charityResult.data as PublicCharity[]) ?? [];

      const profile = profileResult.data as
        | { account_kind?: string | null; display_name?: string | null; full_name?: string | null }
        | null;
      savedKind = isAccountKind(profile?.account_kind)
        ? profile!.account_kind
        : null;
      profileName =
        (profile?.display_name as string | null) ??
        (profile?.full_name as string | null) ??
        "";

      const previous = verificationResult.data?.[0] as
        | {
            applicant_name: string | null;
            applicant_nid: string | null;
            applicant_phone: string | null;
            bkash_number: string | null;
            bank_name: string | null;
            bank_account_number: string | null;
          }
        | undefined;

      if (previous?.applicant_nid && previous.applicant_name) {
        known = {
          name: previous.applicant_name,
          nidTail: tail(previous.applicant_nid),
          phoneTail: tail(previous.applicant_phone),
          payout: previous.bkash_number
            ? `bKash/Nagad ending ${tail(previous.bkash_number)}`
            : previous.bank_account_number
              ? `${previous.bank_name ?? "Bank"} account ending ${tail(previous.bank_account_number)}`
              : null,
          hasIdDocument: (documentResult.data?.length ?? 0) > 0,
        };
      }
    }
  }

  if (!userId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
          ক্যাম্পেইন শুরু করুন
        </h1>
        <p className="mt-2 text-xl font-semibold">Start a campaign</p>
        <p className="mt-6 max-w-md leading-relaxed text-body">
          Create a free account to open the campaign form. Every campaign is
          checked by our internal verification team before going live, with a
          direct payout.
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
    );
  }

  // ?kind= lets someone raise something other than their usual thing
  // this once, without changing what their account is.
  const override = isAccountKind(kindParam) ? kindParam : null;
  const chosen = override ?? savedKind;

  if (!chosen) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
          কী জন্য তহবিল সংগ্রহ করছেন?
        </h1>
        <p className="mt-2 text-xl font-semibold">What are you raising for?</p>
        <KindPicker />
      </main>
    );
  }

  const info = accountKind(chosen);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="font-bengali text-3xl font-bold sm:text-4xl">
        {info.formTitleBn}
      </h1>
      <p className="mt-2 text-xl font-semibold">{info.formTitle}</p>
      <CampaignWizard
        userId={userId}
        charities={charities}
        kind={chosen}
        profileName={profileName}
        known={again === "1" ? null : known}
      />
    </main>
  );
}
