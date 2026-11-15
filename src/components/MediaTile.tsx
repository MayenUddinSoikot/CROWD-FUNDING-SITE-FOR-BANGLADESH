import type { SiteMedia } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/types";

/* Renders one photo or video that Shohay placed on the site.
   Photos fill their frame; videos keep their own shape. */

export function MediaFrame({
  item,
  className = "",
}: {
  item: SiteMedia;
  className?: string;
}) {
  if (item.media_type === "youtube") {
    return (
      <iframe
        src={youtubeEmbedUrl(item.url) ?? item.url}
        title={item.title ?? "Shohay video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={`h-full w-full bg-black ${className}`}
      />
    );
  }

  if (item.media_type === "video") {
    return (
      <video
        src={item.url}
        controls
        playsInline
        preload="metadata"
        className={`h-full w-full bg-black object-contain ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.title ?? ""}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
