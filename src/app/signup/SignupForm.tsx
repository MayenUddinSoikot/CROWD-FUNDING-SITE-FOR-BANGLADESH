"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { Button, inputClass } from "@/components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  // Every field is controlled. React resets *uncontrolled* inputs once a
  // form action finishes — including when it finishes with an error — so
  // an uncontrolled form would wipe everything the moment one field is
  // wrong. (Same fix as the campaign wizard.)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (state?.error) {
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  if (state?.confirmEmail) {
    return (
      <div className="mt-8 w-full rounded-2xl bg-brand-tint p-6 text-center shadow-soft">
        <p className="text-2xl" aria-hidden="true">
          📬
        </p>
        <p className="mt-2 text-lg font-bold text-brand-dark">
          Confirm your email to finish
        </p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          We sent a confirmation link to{" "}
          <span className="font-semibold">{state.confirmEmail}</span>. Click it
          and you&rsquo;ll be able to log in and start your campaign.
        </p>
        <p className="font-bengali mt-2 text-sm leading-relaxed text-muted">
          আপনার ইমেইলে একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে — লিংকে ক্লিক করে লগ
          ইন করুন।
        </p>
        <p className="mt-4 text-xs text-muted">
          Can&rsquo;t see it? Check your spam or promotions folder.
        </p>
        <Link
          href="/login"
          className="press mt-5 inline-block text-sm font-bold text-brand"
        >
          Go to log in →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 w-full text-left">
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
        We use this to log you in and to send campaign updates.
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

      <label className="mt-4 block text-sm font-semibold" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor="confirm_password"
      >
        Repeat password
      </label>
      <input
        id="confirm_password"
        name="confirm_password"
        type={showPassword ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
      />

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="h-4 w-4"
        />
        Show passwords
      </label>
      <p className="mt-1 text-xs text-muted">
        At least 8 characters. · কমপক্ষে ৮ অক্ষর।
      </p>

      {state?.error ? (
        <p
          ref={errorRef}
          className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" full disabled={pending} className="mt-6">
        {pending ? "Creating your account…" : "Create my account"}
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
