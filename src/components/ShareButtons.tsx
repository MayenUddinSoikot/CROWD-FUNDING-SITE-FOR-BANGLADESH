"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const text = `${title} — Shohay সহায়`;

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — no-op; the share links still work.
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium opacity-70">
        Share this campaign · <span className="font-bengali">শেয়ার করুন</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          WhatsApp
        </a>
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Facebook
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
