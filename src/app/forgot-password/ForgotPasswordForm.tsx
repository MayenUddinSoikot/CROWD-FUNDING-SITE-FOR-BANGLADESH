"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (err) {
        setError("Could not send the email. Check the address and try again.");
      } else {
        setSent(true);
      }
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 w-full rounded-2xl border border-brand/30 bg-brand/10 p-5 text-center text-sm">
        📬 Check your inbox! We sent a password-reset link to{" "}
        <span className="font-semibold">{email}</span>. The link opens a page
        where you can set a new password.
        <p className="font-bengali mt-2 opacity-80">
          আপনার ইমেইল চেক করুন — পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full text-left">
      <label className="block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link · রিসেট লিংক পাঠান"}
      </button>
    </form>
  );
}
