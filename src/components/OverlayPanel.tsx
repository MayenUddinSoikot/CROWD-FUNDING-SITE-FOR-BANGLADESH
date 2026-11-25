"use client";

import { useState } from "react";

/* The creator's own OBS link.

   The URL is the secret — anyone holding it sees the alerts — so the
   panel keeps it hidden until asked, which matters because creators
   screen-share this page while setting up. */

const OPTIONS = [
  { key: "", label: "Alerts only", hint: "A card pops up for each gift" },
  {
    key: "?bar=1",
    label: "Alerts + today's total",
    hint: "Adds a running total for today",
  },
  {
    key: "?bar=1&total=all",
    label: "Alerts + lifetime total",
    hint: "Running total across all your campaigns",
  },
  {
    key: "?align=right&bar=1",
    label: "Right-hand side",
    hint: "For a layout with the camera on the left",
  },
] as const;

export function OverlayPanel({
  overlayKey,
  siteUrl,
}: {
  overlayKey: string | null;
  siteUrl: string;
}) {
  const [choice, setChoice] = useState(0);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!overlayKey) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <p className="font-bold">Live donation alerts</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Your overlay link will appear here once the live-alerts update has
          been applied to the database.
        </p>
      </div>
    );
  }

  const base = siteUrl.replace(/\/$/, "");
  const url = `${base}/overlay/${overlayKey}${OPTIONS[choice].key}`;
  const masked = `${base}/overlay/${"•".repeat(12)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-soft">
      <p className="font-bold">
        Live donation alerts{" "}
        <span className="font-normal text-muted">for Facebook & YouTube</span>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-body">
        Put this link in OBS and every donation pops up on your stream while
        you&rsquo;re live.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((o, i) => (
          <button
            key={o.label}
            type="button"
            onClick={() => setChoice(i)}
            aria-pressed={choice === i}
            className={`press rounded-xl border-2 p-3 text-left ${
              choice === i
                ? "border-brand bg-brand-tint"
                : "border-foreground/10 bg-background hover:border-brand"
            }`}
          >
            <span className="block text-sm font-bold">{o.label}</span>
            <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-4 py-3 text-sm">
          {shown ? url : masked}
        </code>
        <button
          type="button"
          onClick={() => setShown(!shown)}
          className="press min-h-[44px] shrink-0 rounded-full border border-foreground/15 px-4 text-sm font-bold hover:border-brand hover:text-brand"
        >
          {shown ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="press min-h-[44px] shrink-0 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-accent-ink">
        Keep this link private. Anyone who has it can watch your donations
        come in — don&rsquo;t show it on stream.
      </p>

      <details className="mt-5 rounded-xl bg-background p-4">
        <summary className="cursor-pointer text-sm font-bold">
          How to add it in OBS
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-body">
          <li>In OBS, under Sources, click + and choose Browser.</li>
          <li>Name it &ldquo;Shohay alerts&rdquo; and press OK.</li>
          <li>Paste the link above into the URL box.</li>
          <li>
            Set Width <b>1920</b> and Height <b>1080</b>, then press OK.
          </li>
          <li>
            Drag it over your scene. The background is transparent, so only the
            card shows.
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Streaming from a phone instead? Most phone apps can&rsquo;t add a
          browser layer — put the link in a browser on a laptop and screen-share
          that, or stream from a computer.
        </p>
      </details>
    </div>
  );
}
