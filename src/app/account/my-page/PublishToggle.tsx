"use client";

import { useState } from "react";
import { setPagePublished } from "./actions";

/* Published or not.

   A page nobody can find is the single most common way a creator ends
   up raising nothing, so the state is said in words rather than left
   to a switch nobody reads. */

export function PublishToggle({ published }: { published: boolean }) {
  const [on, setOn] = useState(published);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !on;
    const ok = await setPagePublished(next);
    if (ok) setOn(next);
    setPending(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold">
          {on ? "Your page is live" : "Your page is hidden"}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {on
            ? "Anyone with the link can see it, and it appears under Creators."
            : "Only you can see it. Nobody can support you until it's live."}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`press min-h-[44px] shrink-0 rounded-full px-5 text-sm font-bold disabled:opacity-60 ${
          on
            ? "border border-foreground/15 bg-card hover:border-accent hover:text-accent"
            : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {pending ? "Saving…" : on ? "Hide my page" : "Publish my page"}
      </button>
    </div>
  );
}
