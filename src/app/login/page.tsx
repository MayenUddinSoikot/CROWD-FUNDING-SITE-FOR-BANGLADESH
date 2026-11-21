import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in — Shohay সহায়" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { confirmed } = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/start");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-16 text-center">
      <h1 className="font-bengali text-3xl font-bold">লগ ইন করুন</h1>
      <p className="mt-1 text-lg font-semibold">Log in</p>
      <p className="mt-3 max-w-sm text-sm text-muted">
        Log in to create and manage your campaigns. Donors never need an
        account.
      </p>

      {/* Arriving from the email confirmation link. */}
      {confirmed ? (
        <p className="mt-5 w-full rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">
          ✓ Email confirmed — log in below to start your campaign.
        </p>
      ) : null}

      <LoginForm />

      <p className="mt-6 text-sm">
        New to Shohay?{" "}
        <Link href="/signup" className="font-bold text-brand">
          Create a free account
        </Link>
      </p>
    </main>
  );
}
