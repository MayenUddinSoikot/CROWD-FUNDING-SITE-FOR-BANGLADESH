"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { joinMembership } from "./actions";
import { Button, inputClass } from "@/components/ui";
import { formatTaka } from "@/lib/format";
import type { MembershipTier } from "@/lib/memberships";

const CUSTOM_PRESETS = [100, 200, 500, 1000];

export function JoinForm({
  username,
  creatorName,
  tiers,
  initialTierId,
  siteUrl,
}: {
  username: string;
  creatorName: string;
  tiers: MembershipTier[];
  initialTierId: string | null;
  siteUrl: string;
}) {
  const [state, action, pending] = useActionState(joinMembership, undefined);

  const [tierId, setTierId] = useState<string>(
    initialTierId && tiers.some((t) => t.id === initialTierId)
      ? initialTierId
      : (tiers[0]?.id ?? "")
  );
  const [custom, setCustom] = useState<number>(200);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (state?.error) errorRef.current?.scrollIntoView({ block: "center" });
  }, [state]);

  const chosen = tiers.find((t) => t.id === tierId) ?? null;
  const monthly = chosen ? Number(chosen.amount) : custom;

  if (state?.joined) {
    const link = `${siteUrl.replace(/\/$/, "")}/supporter/${state.joined.accessKey}`;
    return (
      <div className="rounded-2xl bg-card p-6 shadow-lift sm:p-8">
        <p className="text-3xl" aria-hidden="true">
          💚
        </p>
        <p className="mt-2 text-xl font-extrabold">
          You&rsquo;re supporting {creatorName}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Save this link. It&rsquo;s how you get back to your supporter page
          and anything {creatorName} posts for members only — there&rsquo;s no
          password and no account.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-4 py-3 text-sm">
            {link}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
            className="press min-h-[44px] shrink-0 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-warn-tint px-4 py-3 text-sm leading-relaxed text-warn-ink">
          Nothing has been charged. Card and bKash payments are still being
          connected — {creatorName} will be in touch about how to pay.
        </p>

        <Link
          href={`/supporter/${state.joined.accessKey}`}
          className="press mt-5 inline-block font-bold text-brand"
        >
          Open my supporter page →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl bg-card p-6 shadow-lift sm:p-8">
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="tier_id" value={tierId} />
      <input type="hidden" name="amount" value={chosen ? "" : custom} />

      {tiers.length > 0 ? (
        <>
          <p className="text-sm font-bold">Choose a tier</p>
          <div className="mt-3 space-y-2">
            {tiers.map((t) => {
              const on = t.id === tierId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  aria-pressed={on}
                  className={`press block w-full rounded-xl border-2 p-4 text-left ${
                    on
                      ? "border-brand bg-brand-tint"
                      : "border-foreground/10 bg-background hover:border-brand"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-bold">{t.name}</span>
                    <span className="shrink-0 font-extrabold text-brand">
                      {formatTaka(Number(t.amount))}
                      <span className="text-xs font-semibold text-muted">
                        /month
                      </span>
                    </span>
                  </span>
                  {t.name_bn ? (
                    <span className="font-bengali mt-0.5 block text-sm text-muted">
                      {t.name_bn}
                    </span>
                  ) : null}
                  {t.perks ? (
                    <span className="mt-1.5 block whitespace-pre-line text-sm leading-relaxed text-body">
                      {t.perks}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setTierId("")}
              aria-pressed={tierId === ""}
              className={`press block w-full rounded-xl border-2 p-4 text-left ${
                tierId === ""
                  ? "border-brand bg-brand-tint"
                  : "border-foreground/10 bg-background hover:border-brand"
              }`}
            >
              <span className="font-bold">Choose my own amount</span>
            </button>
          </div>
        </>
      ) : null}

      {!chosen ? (
        <>
          <p className="mt-5 text-sm font-bold">How much each month?</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {CUSTOM_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCustom(v)}
                aria-pressed={custom === v}
                className={`press min-h-[48px] rounded-xl border-2 text-sm font-bold ${
                  custom === v
                    ? "border-brand bg-brand text-white"
                    : "border-foreground/10 bg-background hover:border-brand"
                }`}
              >
                {formatTaka(v)}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm font-medium" htmlFor="own">
            Or type an amount
          </label>
          <input
            id="own"
            type="number"
            min={10}
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(Math.max(0, Number(e.target.value) || 0))}
            className={inputClass}
          />
        </>
      ) : null}

      <label className="mt-5 block text-sm font-medium" htmlFor="supporter_name">
        Your name (optional)
      </label>
      <input
        id="supporter_name"
        name="supporter_name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="contact">
        Phone or email
      </label>
      <input
        id="contact"
        name="contact"
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="01XXXXXXXXX or you@email.com"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="message">
        A note for {creatorName} (optional)
      </label>
      <input
        id="message"
        name="message"
        maxLength={200}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={inputClass}
      />

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="is_public"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          Show my name on {creatorName}&rsquo;s supporter wall
          <span className="block text-xs text-muted">
            Untick to support quietly — they&rsquo;ll still see you.
          </span>
        </span>
      </label>
      {/* A ticked box posts "on"; an unticked one posts nothing, so the
          action treats a missing value as public. This makes it explicit. */}
      {!isPublic ? (
        <input type="hidden" name="is_public" value="off" />
      ) : null}

      {state?.error ? (
        <p
          ref={errorRef}
          className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" full disabled={pending} className="mt-5">
        {pending
          ? "Setting it up…"
          : `Support with ${formatTaka(monthly || 0)}/month`}
      </Button>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Nothing is charged today — card and bKash payments are still being
        connected. You can stop any time from your supporter page.
      </p>
    </form>
  );
}
