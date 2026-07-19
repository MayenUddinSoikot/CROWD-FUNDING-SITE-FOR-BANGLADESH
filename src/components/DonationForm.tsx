"use client";

import { useActionState, useState } from "react";
import { startDonation } from "@/app/campaigns/[slug]/donate-actions";
import { formatTaka } from "@/lib/format";

const PRESETS = [50, 100, 500, 1000, 5000, 100000];

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

export function DonationForm({ campaignId }: { campaignId: string }) {
  const [state, action, pending] = useActionState(startDonation, undefined);
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState<string>("");

  const effectiveAmount = custom ? Number(custom) : amount;

  if (state?.pledged) {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center">
        <p className="text-lg font-semibold text-brand">
          Thank you! · ধন্যবাদ 💚
        </p>
        <p className="mt-2 text-sm opacity-80">
          Your {formatTaka(state.amount)} pledge is recorded. Online payment
          (bKash / Nagad / card) is being connected — you&rsquo;ll be able to
          complete it here very soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="amount" value={effectiveAmount || 0} />

      <p className="text-sm font-medium">Choose an amount · টাকার পরিমাণ</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {PRESETS.map((value) => {
          const active = !custom && amount === value;
          return (
            <button
              type="button"
              key={value}
              onClick={() => {
                setAmount(value);
                setCustom("");
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-foreground/20 hover:border-brand"
              }`}
            >
              {value === 100000 ? "৳1 lac" : formatTaka(value)}
            </button>
          );
        })}
      </div>

      <label className="mt-3 block text-sm font-medium" htmlFor="custom-amount">
        Or enter a custom amount
      </label>
      <input
        id="custom-amount"
        type="number"
        min={10}
        inputMode="numeric"
        placeholder="৳ …"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        className={inputClass}
      />

      <label className="mt-4 block text-sm font-medium" htmlFor="donor_name">
        Your name (optional)
      </label>
      <input id="donor_name" name="donor_name" className={inputClass} />

      <label className="mt-3 block text-sm font-medium" htmlFor="contact">
        Phone or email · থ্যাংক-ইউ পাঠাতে
      </label>
      <input
        id="contact"
        name="contact"
        required
        placeholder="01XXXXXXXXX or you@email.com"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="message">
        Short message (max 25 letters)
      </label>
      <input
        id="message"
        name="message"
        maxLength={25}
        placeholder="Get well soon!"
        className={inputClass}
      />

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_anonymous" className="h-4 w-4" />
        Donate anonymously · নাম গোপন রাখুন
      </label>

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !effectiveAmount}
        className="mt-4 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : `Donate ${effectiveAmount ? formatTaka(effectiveAmount) : ""} · দান করুন`}
      </button>
      <p className="mt-2 text-center text-xs opacity-50">
        Secure payment via bKash · Nagad · card (connecting soon)
      </p>
    </form>
  );
}
