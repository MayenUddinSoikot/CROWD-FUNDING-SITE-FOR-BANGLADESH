"use client";

import { useState } from "react";

/* The homepage as a visitor sees it, inside the admin page.

   Two jobs. One: change a heading, hit refresh, see it — instead of
   editing blind and opening another tab. Two: the width buttons, so a
   banner can be checked on a phone without owning every phone. Most of
   Shohay's visitors arrive on a 390px screen; that is the width that
   matters, and it is the one nobody checks. */

const WIDTHS = [
  { key: "phone", label: "Phone", px: 390, note: "most visitors" },
  { key: "tablet", label: "Tablet", px: 820, note: "" },
  { key: "desktop", label: "Desktop", px: 1440, note: "" },
] as const;

export function HomepagePreview() {
  const [width, setWidth] = useState<number>(390);
  const [nonce, setNonce] = useState(() => Date.now());

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {WIDTHS.map((w) => (
          <button
            key={w.key}
            type="button"
            onClick={() => setWidth(w.px)}
            aria-pressed={width === w.px}
            className={`press rounded-full px-4 py-2 text-xs font-bold ${
              width === w.px
                ? "bg-brand text-white"
                : "border border-foreground/15 bg-card text-body"
            }`}
          >
            {w.label} · {w.px}px
            {w.note ? (
              <span
                className={width === w.px ? "text-white/70" : "text-muted"}
              >
                {" "}
                ({w.note})
              </span>
            ) : null}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setNonce(Date.now())}
          className="press ml-auto rounded-full border border-foreground/15 px-4 py-2 text-xs font-bold hover:border-brand hover:text-brand"
        >
          ↻ Refresh preview
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="press rounded-full border border-foreground/15 px-4 py-2 text-xs font-bold no-underline hover:border-brand hover:text-brand"
        >
          Open in a tab ↗
        </a>
      </div>

      <p className="mt-2 text-xs text-muted">
        Save a change above, then hit refresh to see it here.
      </p>

      {/* The frame is scaled down so a 1440px page still fits on the
          screen you are editing from, without changing what the page
          thinks its width is. */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/15 bg-background">
        <div className="h-[520px] overflow-y-auto overflow-x-hidden">
          <div
            style={{
              width,
              transform: width > 900 ? "scale(0.62)" : "none",
              transformOrigin: "top left",
            }}
            className="mx-auto"
          >
            <iframe
              key={`${width}-${nonce}`}
              src={`/?preview=${nonce}`}
              title="Homepage preview"
              style={{ width, height: width > 900 ? 1500 : 1400 }}
              className="block border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
