import { SafeImage } from "@/components/SafeImage";

/* A campaign's cover photo. If the link is broken — someone pasted a
   page address instead of an image, or the file was deleted — fall back
   to the category tile rather than the browser's broken-image icon.

   The detection lives in SafeImage, which also catches the common case
   of the image failing before React has hydrated. */

export function CoverImage({
  src,
  emoji,
  className = "",
}: {
  src: string | null;
  emoji: string;
  className?: string;
}) {
  return (
    <SafeImage
      src={src}
      alt=""
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-tint to-brand/10 text-5xl">
          {emoji}
        </div>
      }
    />
  );
}
