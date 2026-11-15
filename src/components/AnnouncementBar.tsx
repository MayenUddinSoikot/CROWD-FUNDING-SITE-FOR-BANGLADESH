"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Announcement } from "@/lib/types";

/* The bar at the very top of every page. Several short lines rotate
   every few seconds, with arrows and swipe — the pattern used on
   kalonbd.com. One message alone just sits still. */

const ROTATE_MS = 4000;

export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    // Someone who prefers less motion shouldn't get a moving bar.
    const still =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still) return;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      ROTATE_MS
    );
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  const current = items[Math.min(index, count - 1)];
  const urgent = current.tone === "urgent";
  const go = (next: number) => setIndex((next + count) % count);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }

  const body = (
    <>
      <span>{current.message}</span>
      {current.message_bn ? (
        <span className="font-bengali hidden normal-case tracking-normal sm:inline">
          · {current.message_bn}
        </span>
      ) : null}
    </>
  );

  return (
    <div
      className={`${urgent ? "bg-accent" : "bg-brand-dark"} text-white`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto flex min-h-[44px] max-w-6xl items-center gap-1 px-2 sm:px-6">
        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous announcement"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg opacity-75 hover:opacity-100"
          >
            ‹
          </button>
        ) : null}

        <div
          className="flex-1 overflow-hidden text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="flex flex-wrap items-center justify-center gap-x-2 py-2 text-[11.5px] font-bold uppercase leading-snug tracking-wider sm:text-xs">
            {current.link_url ? (
              <Link
                href={current.link_url}
                className="press inline-flex flex-wrap items-center justify-center gap-x-2 underline decoration-white/40 underline-offset-4 hover:decoration-white"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </p>
        </div>

        {count > 1 ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next announcement"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg opacity-75 hover:opacity-100"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
