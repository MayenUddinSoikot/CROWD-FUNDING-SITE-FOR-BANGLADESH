"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(
          "Could not set the password. The reset link may have expired — request a new one from the login page."
        );
      } else {
        setDone(true);
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 w-full rounded-2xl border border-brand/30 bg-brand/10 p-5 text-center text-sm">
        ✅ Password updated! You&rsquo;re logged in.
        <p className="mt-3">
          <Link
            href="/account"
            className="font-semibold text-brand hover:underline"
          >
            Go to my campaigns →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full text-left">
      <label className="block text-sm font-medium" htmlFor="password">
        New password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      <label className="mt-4 block text-sm font-medium" htmlFor="confirm">
        Confirm new password
      </label>
      <input
        id="confirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password · সংরক্ষণ করুন"}
      </button>
    </form>
  );
}
