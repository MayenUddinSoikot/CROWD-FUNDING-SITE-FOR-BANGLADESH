"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { startDonation } from "@/app/campaigns/[slug]/donate-actions";
import { formatTaka } from "@/lib/format";

// One cha = ৳50. Supporters buy a number of chas, Buy-Me-a-Coffee style.
const CHA_PRICE = 50;
const QUANTITIES = [1, 3, 5, 10];
const TIP_RATE = 0.05;

export function CreatorSupportBox({
  campaignId,
  slug,
  creatorName,
}: {
  campaignId: string;
  slug: string;
  creatorName: string;
}) {
  const [state, action, pending] = useActionState(startDonation, undefined);
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [addTip, setAddTip] = useState(true);

  const chas = customQuantity
    ? Math.min(999, Math.max(1, Math.round(Number(customQuantity) || 0)))
    : quantity;
  const amount = chas * CHA_PRICE;
  const tip = addTip ? Math.round(amount * TIP_RATE) : 0;
  const total = amount + tip;

  if (state?.pledged) {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center">
        <p className="text-3xl">☕</p>
        <p className="mt-2 text-lg font-semibold text-brand">
          Thank you! · ধন্যবাদ 💚
        </p>
        <p className="mt-2 text-sm opacity-80">
          Your {formatTaka(state.amount)} support for {creatorName} is recorded
          and now shows on their page.
          {monthly
            ? " Monthly support starts once live payments are connected."
            : ""}{" "}
          (No money is charged yet during testing.)
        </p>
        <Link
          href={`/campaigns/${slug}`}
          className="mt-4 inline-block rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          See the page →
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm"
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="tip_amount" value={tip} />

      <h2 className="text-xl font-bold">
        Buy {creatorName} a cha{" "}
        <span title="A small thank-you for their work">☕</span>
      </h2>

      {/* Cha quantity picker */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
        <span className="text-3xl">☕</span>
        <span className="text-lg opacity-40">×</span>
        {QUANTITIES.map((q) => {
          const active = !customQuantity && quantity === q;
          return (
            <button
              type="button"
              key={q}
              onClick={() => {
                setQuantity(q);
                setCustomQuantity("");
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border text-base font-semibold transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-brand/30 bg-background hover:border-brand"
              }`}
            >
              {q}
            </button>
          );
        })}
        <input
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          aria-label="Custom number of chas"
          placeholder="Other"
          value={customQuantity}
          onChange={(e) => setCustomQuantity(e.target.value)}
          className="h-11 w-20 rounded-full border border-brand/30 bg-background px-3 text-center text-sm outline-none focus:border-brand"
        />
      </div>

      <label className="sr-only" htmlFor="support-name">
        Your name
      </label>
      <input
        id="support-name"
        name="donor_name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name or @yoursocial (optional)"
        className="mt-3 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 outline-none focus:border-brand"
      />

      <label className="sr-only" htmlFor="support-contact">
        Phone or email
      </label>
      <input
        id="support-contact"
        name="contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Phone or email (optional — for your receipt)"
        className="mt-3 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 outline-none focus:border-brand"
      />

      <label className="sr-only" htmlFor="support-message">
        Message
      </label>
      <textarea
        id="support-message"
        name="message"
        rows={4}
        maxLength={200}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Say something nice…"
        className="mt-3 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 outline-none focus:border-brand"
      />

      <label className="mt-4 flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="is_monthly"
          checked={monthly}
          onChange={(e) => setMonthly(e.target.checked)}
          className="h-4 w-4"
        />
        Make this monthly ·{" "}
        <span className="font-bengali">প্রতি মাসে</span>
      </label>

      <label className="mt-2 flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={addTip}
          onChange={(e) => setAddTip(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span className="opacity-70">
          Add {formatTaka(Math.round(amount * TIP_RATE))} to keep Shohay free
          for creators (0% platform fee) — uncheck any time.
        </span>
      </label>

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-brand px-6 py-3.5 text-lg font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Please wait…" : `Support ${formatTaka(total)}`}
      </button>
      <p className="mt-2 text-center text-xs opacity-50">
        bKash · Nagad · card (connecting soon)
      </p>
    </form>
  );
}
