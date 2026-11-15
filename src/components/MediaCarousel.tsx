"use client";

import { useRef, useState } from "react";
import type { CampaignMedia } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/types";

/* A campaign's photos and video. The first thing a donor sees, so it
   gets a proper stage: full-bleed media, thumbnails, swipe, arrows and
   keyboard support — and it never letterboxes a photo. */

export function MediaCarousel({
  media,
  fallbackEmoji,
}: {
  media: CampaignMedia[];
  fallbackEmoji: string;
}) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-tint to-brand/5 text-6xl">
        {fallbackEmoji}
      </div>
    );
  }

  const count = media.length;
  const go = (next: number) => setIndex((next + count) % count);
  const current = media[index];

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  }

  return (
    <div>
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-foreground/5 shadow-soft"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        tabIndex={count > 1 ? 0 : -1}
        role={count > 1 ? "group" : undefined}
        aria-label={count > 1 ? `Photo ${index + 1} of ${count}` : undefined}
      >
        {current.media_type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : current.media_type === "youtube" ? (
          <iframe
            src={youtubeEmbedUrl(current.url) ?? current.url}
            title="Campaign video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full bg-black"
          />
        ) : (
          <>
            {/* A blurred copy fills the frame behind a vertical phone video,
                instead of hard black bars. */}
            <video
              src={current.url}
              muted
              playsInline
              preload="metadata"
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
            />
            <video
              src={current.url}
              controls
              playsInline
              preload="metadata"
              className="relative h-full w-full object-contain"
            />
          </>
        )}

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => go(index - 1)}
              className="press absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/65"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => go(index + 1)}
              className="press absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/65"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {/* Thumbnails */}
      {count > 1 ? (
        <div className="scroll-x mt-3 flex gap-2.5 pb-1">
          {media.map((m, i) => {
            const active = i === index;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show item ${i + 1}`}
                aria-current={active}
                className={`press relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ${
                  active
                    ? "ring-2 ring-brand ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {m.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-foreground/80 text-white">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
