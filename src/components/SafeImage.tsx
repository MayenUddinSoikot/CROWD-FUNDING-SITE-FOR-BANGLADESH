"use client";

import { useState, type ReactNode } from "react";

/* An image that never leaves a broken icon on the page.

   Creators paste links by hand, and some of them are wrong — one early
   campaign has a Google search URL saved as its photo. A broken image
   on a page asking strangers for money reads as a broken platform, so
   anything that fails to load is replaced by the fallback instead. */

export function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
