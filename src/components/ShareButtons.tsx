"use client";

import { useState } from "react";

/* The share sheet.

   Two halves: the usual send-a-link buttons, and — when we know which
   campaign this is — a kit of ready-made images sized for a story, a
   feed post and a link preview, each with a QR code baked in. Removing
   the design work is most of what makes a creator post at all.

   If the person looking at this has a creator username, every link and
   every image carries ?via=<them>, so whatever it raises is credited to
   them on the leaderboard. */

const IMAGE_FORMATS = [
  {
    key: "story",
    label: "Story",
    hint: "Instagram & Facebook story · 1080×1920",
    ratio: "aspect-[9/16]",
  },
  {
    key: "square",
    label: "Feed post",
    hint: "Instagram & Facebook feed · 1080×1080",
    ratio: "aspect-square",
  },
  {
    key: "og",
    label: "Link preview",
    hint: "WhatsApp & X · 1200×630",
    ratio: "aspect-[1200/630]",
  },
] as const;

export function ShareButtons({
  title,
  path,
  slug,
  via,
}: {
  title: string;
  path?: string;
  slug?: string;
  via?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function openModal() {
    if (typeof window !== "undefined") {
      const base = path
        ? `${window.location.origin}${path}`
        : `${window.location.origin}${window.location.pathname}`;
      setOrigin(window.location.origin);
      setUrl(via ? `${base}?via=${via}` : base);
    }
    setOpen(true);
  }

  const text = `${title} — Shohay সহায়`;
  const e = encodeURIComponent;

  const links: { label: string; href: string; color: string }[] = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
      color: "bg-[#1877F2]",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${e(`${text} ${url}`)}`,
      color: "bg-[#25D366]",
    },
    {
      label: "Messenger",
      href: `https://www.facebook.com/dialog/send?link=${e(url)}&app_id=0&redirect_uri=${e(url)}`,
      color: "bg-[#0084FF]",
    },
    {
      label: "Email",
      href: `mailto:?subject=${e(text)}&body=${e(`${text}\n${url}`)}`,
      color: "bg-foreground/70",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
      color: "bg-[#0A66C2]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`,
      color: "bg-black",
    },
  ];

  function cardUrl(format: string): string {
    const q = new URLSearchParams({ format });
    if (via) q.set("via", via);
    return `${origin}/campaigns/${slug}/share-card?${q.toString()}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-foreground/15 bg-card px-6 py-3 text-lg font-bold hover:border-brand hover:text-brand"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
        Share · <span className="font-bengali">শেয়ার করুন</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Share this campaign</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-xl opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {via ? (
              <p className="mt-3 rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-dark">
                Everything here carries your link — whatever it raises is
                counted under <b>@{via}</b>.
              </p>
            ) : null}

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-foreground/15 bg-card p-2">
              <span className="flex-1 truncate px-2 text-sm opacity-70">
                {url}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="press shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>

            {/* Ready-made images */}
            {slug ? (
              <>
                <p className="mt-6 text-sm font-semibold">
                  Ready-made posts
                  <span className="ml-2 font-normal text-muted">
                    photo, progress and a QR code
                  </span>
                </p>
                <div className="mt-3 space-y-2">
                  {IMAGE_FORMATS.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-card p-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">
                          {f.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {f.hint}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreview(preview === f.key ? null : f.key)
                        }
                        className="press shrink-0 rounded-lg border border-foreground/15 px-3 py-2 text-xs font-bold hover:border-brand hover:text-brand"
                      >
                        {preview === f.key ? "Hide" : "Preview"}
                      </button>
                      <a
                        href={cardUrl(f.key)}
                        download={`shohay-${slug}-${f.key}.png`}
                        className="press shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-dark"
                      >
                        Save
                      </a>
                    </div>
                  ))}
                </div>

                {preview ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-foreground/10 bg-card p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cardUrl(preview)}
                      alt={`${preview} preview`}
                      className="mx-auto max-h-[420px] w-auto rounded-lg"
                    />
                    <p className="mt-2 text-center text-xs text-muted">
                      On a phone, press and hold the image to save it.
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}

            <p className="mt-6 text-sm font-semibold">Send it to someone</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3 text-sm font-medium transition hover:border-brand"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${l.color}`}
                  >
                    {l.label[0]}
                  </span>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
