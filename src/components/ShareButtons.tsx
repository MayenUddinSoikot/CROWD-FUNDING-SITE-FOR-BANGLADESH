"use client";

import { useState } from "react";

export function ShareButtons({
  title,
  path,
}: {
  title: string;
  path?: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  function openModal() {
    if (typeof window !== "undefined") {
      setUrl(path ? `${window.location.origin}${path}` : window.location.href);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Quick share</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-xl opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-foreground/15 bg-card p-2">
              <span className="flex-1 truncate px-2 text-sm opacity-70">
                {url}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>

            <p className="mt-5 text-sm font-semibold">Reach more donors</p>
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
