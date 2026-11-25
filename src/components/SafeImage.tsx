"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { optimisedSrcSet } from "@/lib/image-srcset";

/* An image that never leaves a broken icon on the page.

   Creators paste links by hand, and some of them are wrong — one early
   campaign has a Google search URL saved as its photo. A broken image
   on a page asking strangers for money reads as a broken platform.

   onError alone is not enough. The page is rendered on the server, so
   the browser starts loading the image long before React hydrates; if
   it fails in that window the error has already fired and the handler
   is attached too late to ever hear it. The effect below covers that
   case: an <img> that is finished loading but has no width did not
   load, whenever that happened. */

export function SafeImage({
  src,
  alt,
  className,
  fallback,
  loading,
  sizes = "100vw",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
  /* How wide this image is drawn, so the browser can pick the right
     file. Give a real value where the image is not full-width. */
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  /* If a resized copy will not load — the optimiser is down, or the
     host is not one it is allowed to fetch — fall back to the original
     file before giving up on the picture altogether. Hiding every photo
     on the site because a resizing service hiccuped would be a far
     worse failure than serving a photo that is larger than it needs
     to be. */
  const [plainOnly, setPlainOnly] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      srcSet={plainOnly ? undefined : optimisedSrcSet(src)}
      sizes={plainOnly ? undefined : sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => {
        if (!plainOnly && optimisedSrcSet(src)) setPlainOnly(true);
        else setFailed(true);
      }}
    />
  );
}
