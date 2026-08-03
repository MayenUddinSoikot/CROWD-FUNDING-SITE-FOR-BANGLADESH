"use client";

import { useRef, useState } from "react";
import type { CampaignMedia } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/types";

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
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-6xl">
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

  return (
    <div>
      <div
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
            {/* Blurred first frame fills the letterbox area behind vertical videos. */}
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
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white backdrop-blur transition hover:bg-black/65 active:scale-95"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white backdrop-blur transition hover:bg-black/65 active:scale-95"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-2 flex justify-center gap-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Go to item ${i + 1}`}
              onClick={() => setIndex(i)}
              className="flex h-8 items-center px-1"
            >
              <span
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-brand" : "w-2 bg-foreground/25"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
