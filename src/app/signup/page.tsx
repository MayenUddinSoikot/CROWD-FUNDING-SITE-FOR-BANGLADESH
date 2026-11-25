import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Start raising — Shohay সহায়",
  description:
    "Build a page on Shohay and raise for the people who need it. 0% platform fee — every taka reaches them.",
};

const PROMISES = [
  {
    icon: "০%",
    title: "Keep everything you raise",
    body: "Shohay takes 0%. The only deduction is the bank's charge for moving the money.",
  },
  {
    icon: "♡",
    title: "Monthly supporters, not one-offs",
    body: "Tiers, supporters-only posts and a page of your own — so you can plan, not start from zero each time.",
  },
  {
    icon: "✓",
    title: "Verified, so people trust you",
    body: "Our team checks every campaign before it goes live. That is why strangers give.",
  },
];

export default async function SignupPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/start");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        {/* Why you'd want an account */}
        <div className="order-2 lg:order-1">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Start raising on Shohay
          </h1>
          <p className="font-bengali mt-2 text-lg text-muted">
            সহায়-এ শুরু করুন
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-body">
            Build a page, bring the people who already follow you, and raise
            for someone who needs it. Donors never need an account — anyone
            can give without signing up.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            There is no password. We email you a short code each time you
            log in, so there is nothing to invent and nothing to forget.
          </p>

          <ul className="mt-8 space-y-5">
            {PROMISES.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="font-bengali flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-base font-bold text-brand-dark">
                  {item.icon}
                </span>
                <span>
                  <span className="block font-bold">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* The form */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl bg-card p-6 shadow-lift sm:p-7">
            <p className="text-xl font-extrabold">Create your account</p>
            <p className="font-bengali text-sm font-semibold text-muted">
              অ্যাকাউন্ট খুলুন
            </p>
            <SignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
