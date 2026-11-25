import { youtubeEmbedUrl } from "@/lib/types";

/* One photo or video attached to a creator's post.

   Photos fill the frame; uploaded video and YouTube keep their own
   shape against black, so a vertical phone video doesn't get cropped. */

export function PostMedia({
  imageUrl,
  videoUrl,
  alt,
}: {
  imageUrl: string | null;
  videoUrl: string | null;
  alt: string;
}) {
  if (videoUrl) {
    const embed = youtubeEmbedUrl(videoUrl);
    if (embed) {
      return (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embed}
            title={alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    }
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="max-h-[520px] w-full bg-black object-contain"
      />
    );
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt}
        className="max-h-[520px] w-full bg-track object-cover"
      />
    );
  }

  return null;
}
