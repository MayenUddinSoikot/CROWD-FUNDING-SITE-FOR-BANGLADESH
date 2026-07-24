"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { startDonation } from "@/app/campaigns/[slug]/donate-actions";
import { formatTaka } from "@/lib/format";

const DONATE_PRESETS = [50, 100, 500, 1000, 5000, 100000];
const CHA_PRESETS = [20, 50, 100, 200, 500, 1000];
const TIP_PERCENTS = [0, 5, 10, 15];

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

export function DonationForm({
  campaignId,
  slug,
  variant = "donate",
}: {
  campaignId: string;
  slug: string;
  variant?: "donate" | "creator";
}) {
  const isCreator = variant === "creator";
  const PRESETS = isCreator ? CHA_PRESETS : DONATE_PRESETS;
  const [state, action, pending] = useActionState(startDonation, undefined);
  const [amount, setAmount] = useState<number>(isCreator ? 100 : 500);
  const [custom, setCustom] = useState<string>("");
  const [tipPercent, setTipPercent] = useState<number>(5);
  const [customTip, setCustomTip] = useState<string>("");

  const effectiveAmount = custom ? Math.max(0, Math.round(Number(custom))) : amount;
  const tip = customTip
    ? Math.max(0, Math.round(Number(customTip)))
    : Math.round((effectiveAmount * tipPercent) / 100);
  const total = effectiveAmount + tip;

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
        <Link
          href={`/campaigns/${slug}`}
          className="mt-4 inline-block rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          ← Back to campaign
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="amount" value={effectiveAmount || 0} />
      <input type="hidden" name="tip_amount" value={tip} />

      <p className="text-sm font-semibold">
        {isCreator
          ? "Buy them a cha · চা খাওয়ান ☕"
          : "Enter your donation · দানের পরিমাণ"}
      </p>

      {/* Big amount display */}
      <div className="mt-2 flex items-center rounded-2xl border-2 border-foreground/15 bg-card px-4 py-4 focus-within:border-brand">
        <span className="text-3xl font-bold opacity-40">৳</span>
        <input
          type="number"
          min={10}
          inputMode="numeric"
          aria-label="Donation amount"
          value={custom || String(amount)}
          onChange={(e) => {
            setCustom(e.target.value);
          }}
          className="w-full bg-transparent pl-2 text-right text-4xl font-bold outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
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

      {/* Tip */}
      <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-4">
        <p className="text-sm font-semibold">Support Shohay (optional)</p>
        <p className="mt-1 text-xs opacity-60">
          Shohay charges creators a <b>0% platform fee</b>. An optional tip
          keeps the platform running. শহায় বিনামূল্যে — চাইলে সামান্য টিপ দিন।
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIP_PERCENTS.map((p) => {
            const active = !customTip && tipPercent === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => {
                  setTipPercent(p);
                  setCustomTip("");
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-foreground/20 hover:border-brand"
                }`}
              >
                {p}%
              </button>
            );
          })}
          <input
            type="number"
            min={0}
            placeholder="৳ custom"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            className="w-28 rounded-full border border-foreground/20 bg-background px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Donor details */}
      <label className="mt-6 block text-sm font-medium" htmlFor="donor_name">
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

      {/* Totals */}
      <div className="mt-5 rounded-2xl border border-foreground/10 bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="opacity-70">Donation</span>
          <span className="font-medium">{formatTaka(effectiveAmount || 0)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="opacity-70">Shohay tip</span>
          <span className="font-medium">{formatTaka(tip)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-foreground/10 pt-2 text-base font-bold">
          <span>Total today</span>
          <span className="text-brand">{formatTaka(total || 0)}</span>
        </div>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !effectiveAmount}
        className="mt-4 w-full rounded-xl bg-brand px-6 py-3.5 text-lg font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : isCreator
            ? `Buy a cha · ${formatTaka(total || 0)} ☕`
            : `Donate ${formatTaka(total || 0)}`}
      </button>
      <p className="mt-2 text-center text-xs opacity-50">
        Secure payment via bKash · Nagad · card (connecting soon)
      </p>
    </form>
  );
}
