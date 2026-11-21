import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Create an account — Shohay সহায়",
  description:
    "Create a free Shohay account to start a campaign. 0% platform fee — every taka reaches the person who needs it.",
};

const PROMISES = [
  {
    icon: "০%",
    title: "0% platform fee",
    body: "Shohay takes nothing from your campaign. Donors may leave an optional tip.",
  },
  {
    icon: "✓",
    title: "Verified campaigns",
    body: "Our internal team checks every campaign before it goes live, so donors trust yours.",
  },
  {
    icon: "৳",
    title: "Direct payout",
    body: "Funds go to your own bKash, Nagad or bank account 3 days after the campaign ends.",
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
            Create your free Shohay account
          </h1>
          <p className="font-bengali mt-2 text-lg text-muted">
            বিনামূল্যে সহায় অ্যাকাউন্ট খুলুন
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-body">
            You need an account to start a campaign and to manage it
            afterwards. Donors never need one — anyone can give without
            signing up.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            There is no password. We email you a 6-digit code each time you
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
            <p className="font-bengali text-xl font-bold">অ্যাকাউন্ট খুলুন</p>
            <p className="text-sm font-semibold text-muted">Sign up</p>
            <SignupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
