"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { login, sendLoginCode, verifyLoginCode } from "./actions";
import { Button, inputClass } from "@/components/ui";
import { CodeField, CODE_MIN } from "@/components/CodeField";
import { GoogleButton } from "@/components/GoogleButton";

export function LoginForm() {
  // Code by email is the default; password is there for accounts that
  // have one. Accounts made through /signup never do.
  const [mode, setMode] = useState<"code" | "password">("code");

  return (
    <div className="mt-8 w-full text-left">
      <GoogleButton label="Log in with Google" />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-foreground/10" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-foreground/10" />
      </div>

      <div className="flex rounded-full bg-track p-1" role="tablist">
        <TabButton
          active={mode === "code"}
          onClick={() => setMode("code")}
          label="Email me a code"
        />
        <TabButton
          active={mode === "password"}
          onClick={() => setMode("password")}
          label="Use a password"
        />
      </div>

      {mode === "code" ? <CodeLogin /> : <PasswordLogin />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`press min-h-[44px] flex-1 rounded-full px-3 text-sm font-bold ${
        active ? "bg-card text-brand shadow-soft" : "text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function CodeLogin() {
  const [sendState, sendAction, sending] = useActionState(
    sendLoginCode,
    undefined
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyLoginCode,
    undefined
  );
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (sendState?.error || verifyState?.error) {
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [sendState, verifyState]);

  const sentTo = sendState?.sentTo;

  if (sentTo) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl bg-brand-tint px-5 py-4 text-center">
          <p className="text-2xl" aria-hidden="true">
            📬
          </p>
          <p className="mt-1 font-bold text-brand-dark">
            We emailed you a login code
          </p>
          <p className="mt-1 text-sm text-body">
            Sent to <span className="font-semibold">{sentTo}</span>
          </p>
        </div>

        <form action={verifyAction} className="mt-6">
          <input type="hidden" name="email" value={sentTo} />
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
            {verifying ? "Checking…" : "Log in"}
          </Button>
        </form>

        <form action={sendAction} className="mt-4 text-center">
          <input type="hidden" name="email" value={sentTo} />
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

  return (
    <form action={sendAction} className="mt-6">
      <label className="block text-sm font-semibold" htmlFor="email">
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
        We&rsquo;ll send a code — no password needed. · ইমেইলে লগইন কোড
        পাঠানো হবে।
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

      <Button type="submit" size="lg" full disabled={sending} className="mt-5">
        {sending ? "Sending code…" : "Email me a code"}
      </Button>
    </form>
  );
}

function PasswordLogin() {
  const [state, action, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="mt-6">
      <label className="block text-sm font-semibold" htmlFor="pw-email">
        Email
      </label>
      <input
        id="pw-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />

      <label className="mt-4 block text-sm font-semibold" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className={inputClass}
      />

      <p className="mt-2 text-right text-sm">
        <Link href="/forgot-password" className="font-semibold text-brand">
          Forgot password?
        </Link>
      </p>

      {state?.error ? (
        <p
          className="mt-3 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" full disabled={pending} className="mt-5">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
