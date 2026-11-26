import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteUrl } from "@/app/layout";
import { SetupWizard } from "./SetupWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create your page — Shohay সহায়" };

export default async function SetupPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Already has a page — editing happens on My page, not here.
  if (data?.username) redirect("/account/my-page");

  const initialName =
    (data?.display_name as string | null) ??
    (data?.full_name as string | null) ??
    "";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
      <SetupWizard
        userId={user.id}
        initialName={initialName}
        siteUrl={siteUrl}
      />
    </main>
  );
}
