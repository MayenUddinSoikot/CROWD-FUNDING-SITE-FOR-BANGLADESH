"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/* Stopping monthly support.

   Two steps on purpose — one stray tap shouldn't end someone's
   support — but no further than that: making it hard to leave is how
   you lose people's trust. */

export function CancelMembership({ accessKey }: { accessKey: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    setPending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.rpc("cancel_membership", {
        access_key: accessKey,
      });
      if (err) {
        setError("Could not stop it just now. Please try again in a minute.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not stop it just now. Please try again in a minute.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="press text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          Stop monthly support
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
      <p className="font-bold">Stop your monthly support?</p>
      <p className="mt-1 text-sm text-body">
        You can start again whenever you like.
      </p>
      {error ? (
        <p className="mt-3 text-sm font-medium text-accent-ink" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="press min-h-[44px] rounded-full border border-foreground/15 px-5 text-sm font-bold hover:border-brand"
        >
          Keep supporting
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={pending}
          className="press min-h-[44px] rounded-full bg-accent px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Stopping…" : "Yes, stop it"}
        </button>
      </div>
    </div>
  );
}
