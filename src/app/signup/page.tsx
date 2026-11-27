import { CREATOR_FEE_PCT } from "@/lib/fees";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Start raising — Shohay সহায়",
  description:
    "Build a page on Shohay and raise for the people who need it. 0% fee when you raise for a person or a cause.",
};

const PROMISES = [
  {
    icon: "০%",
    title: "0% when you raise for someone",
    body: `A fundraiser or an occasion fundraiser pays Shohay nothing — only the bank's charge for moving the money. A creator page pays ${CREATOR_FEE_PCT}%.`,
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-12 sm:py-16">
      {/* One centred column, as Patreon's signup is. The two-column
          version put a wall of marketing beside the only thing on the
          page anyone came for. */}
      <h1 className="text-center text-3xl font-extrabold leading-tight sm:text-4xl">
        Start raising on Shohay
      </h1>
      <p className="font-bengali mt-2 text-center text-lg text-muted">
        সহায়-এ শুরু করুন
      </p>
      <p className="mx-auto mt-4 max-w-sm text-center leading-relaxed text-body">
        Raising for a person or a cause costs{" "}
        <b className="text-foreground">0%</b>. Build a page, bring the people
        who already follow you, and raise for someone who needs it.
      </p>

      <SignupForm />

      <ul className="mt-10 space-y-4 border-t border-foreground/10 pt-8">
        {PROMISES.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="font-bengali flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-bold text-brand-dark">
              {item.icon}
            </span>
            <span>
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                {item.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
