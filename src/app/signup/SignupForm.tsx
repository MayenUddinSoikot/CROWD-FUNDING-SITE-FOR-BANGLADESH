"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendSignupCode, verifySignupCode } from "./actions";
import { Button, inputClass } from "@/components/ui";
import { CodeField, CODE_MIN } from "@/components/CodeField";

export function SignupForm() {
  const [sendState, sendAction, sending] = useActionState(
    sendSignupCode,
    undefined
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifySignupCode,
    undefined
  );

  // Every field is controlled. React resets *uncontrolled* inputs once a
  // form action finishes — including when it finishes with an error — so
  // an uncontrolled form would wipe everything the moment one field is
  // wrong. (Same fix as the campaign wizard.)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");

  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (sendState?.error || verifyState?.error) {
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [sendState, verifyState]);

  const sent = sendState?.sent;

  /* ---------- Step 2: type the code ---------- */
  if (sent) {
    return (
      <div className="mt-8 w-full text-left">
        <div className="rounded-2xl bg-brand-tint px-5 py-4 text-center">
          <p className="text-2xl" aria-hidden="true">
            📬
          </p>
          <p className="mt-1 font-bold text-brand-dark">
            We emailed you a login code
          </p>
          <p className="mt-1 text-sm text-body">
            Sent to <span className="font-semibold">{sent.email}</span>
          </p>
          <p className="font-bengali mt-1 text-sm text-muted">
            আপনার ইমেইলে ৬ সংখ্যার কোড পাঠানো হয়েছে
          </p>
        </div>

        <form action={verifyAction} className="mt-6">
          <input type="hidden" name="email" value={sent.email} />

          <label className="block text-sm font-semibold" htmlFor="token">
            Enter the code
          </label>
          <CodeField value={token} onChange={setToken} />

          {verifyState?.error ? (
            <p
              ref={errorRef}
              className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
              role="alert"
            >
              {verifyState.error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            full
            disabled={verifying || token.length < CODE_MIN}
            className="mt-5"
          >
            {verifying ? "Checking…" : "Create my account"}
          </Button>
        </form>

        {/* Ask for a fresh code — same details, sent again. */}
        <form action={sendAction} className="mt-4 text-center">
          <input type="hidden" name="full_name" value={sent.fullName} />
          <input type="hidden" name="email" value={sent.email} />
          <input type="hidden" name="phone" value={sent.phone} />
          <button
            type="submit"
            disabled={sending}
            className="press text-sm font-bold text-brand disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send a new code"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Can&rsquo;t see the email? Check your spam or promotions folder. The
          code is good for one hour.
        </p>
      </div>
    );
  }

  /* ---------- Step 1: your details ---------- */
  return (
    <form action={sendAction} className="mt-8 w-full text-left">
      <label className="block text-sm font-semibold" htmlFor="full_name">
        Your full name
      </label>
      <input
        id="full_name"
        name="full_name"
        required
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="As written on your NID"
        className={inputClass}
      />

      <label className="mt-4 block text-sm font-semibold" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted">
        We send your login code here — no password to remember.
      </p>

      <label className="mt-4 block text-sm font-semibold" htmlFor="phone">
        Mobile number
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        required
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="01712345678"
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted">
        Private &amp; confidential — only our internal verification team sees
        it.
      </p>

      {sendState?.error ? (
        <p
          ref={errorRef}
          className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
          role="alert"
        >
          {sendState.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" full disabled={sending} className="mt-6">
        {sending ? "Sending code…" : "Send me a code"}
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold text-brand">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-brand">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-5 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand">
          Log in
        </Link>
      </p>
    </form>
  );
}
