"use client";

import { useState } from "react";

/* A campaign's cover photo. If the link is broken — someone pasted a
   page address instead of an image, or the file was deleted — fall back
   to the category tile rather than the browser's broken-image icon. */

export function CoverImage({
  src,
  emoji,
  className = "",
}: {
  src: string | null;
  emoji: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-tint to-brand/10 text-5xl">
        {emoji}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
