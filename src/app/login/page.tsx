import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in — Shohay সহায়" };

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/start");
  }

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="font-bengali text-3xl font-bold">লগ ইন করুন</h1>
        <p className="mt-1 text-lg font-semibold">Log in</p>
        <p className="mt-3 max-w-sm text-sm opacity-60">
          This is the founder login for creating and managing campaigns —
          donors never need an account.
        </p>
        <LoginForm />
      </main>
    </>
  );
}
