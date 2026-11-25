/* Serve a photo at the size the screen actually needs.

   Everything on Shohay is an <img> rather than next/image, because the
   fallback behaviour (never show a broken frame) and the layouts around
   them are hand-written. Rather than rewrite ten call sites, this hands
   those same <img> tags a srcset pointed at Next's image optimiser, so
   a phone downloads a 414px-wide photo instead of the 4000px one that
   came off somebody's camera.

   Only hosts listed in next.config.ts's remotePatterns can be optimised;
   for anything else we return no srcset and the browser uses src. */

const OPTIMISABLE = [
  "coeqraamujuixtervqgb.supabase.co",
  "images.unsplash.com",
];

const WIDTHS = [360, 414, 640, 828, 1080, 1440, 1920];

function canOptimise(src: string): boolean {
  if (src.startsWith("/")) return true; // our own files
  try {
    return OPTIMISABLE.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function optimisedSrcSet(
  src: string | null | undefined,
  quality = 75
): string | undefined {
  if (!src || !canOptimise(src)) return undefined;
  return WIDTHS.map(
    (w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality} ${w}w`
  ).join(", ");
}
