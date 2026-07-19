"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-8 w-full max-w-sm text-left">
      <label className="block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      <label className="mt-4 block text-sm font-medium" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
