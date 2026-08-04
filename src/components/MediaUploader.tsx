"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { MediaType } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/types";

const BUCKET = "campaign-media";
const MAX_PHOTOS = 4;

type Item = { type: MediaType; url: string; name: string };

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "dat";
}

export function MediaUploader({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Item[]>([]);
  const [video, setVideo] = useState<Item | null>(null);
  const [youtube, setYoutube] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(
    files: FileList | null,
    kind: "image" | "video"
  ) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const added: Item[] = [];
      for (const file of Array.from(files)) {
        if (kind === "image" && photos.length + added.length >= MAX_PHOTOS) {
          setError(`You can add up to ${MAX_PHOTOS} photos.`);
          break;
        }
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name} is larger than 50 MB.`);
          continue;
        }
        const path = `${userId}/${crypto.randomUUID()}.${extensionOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });
        if (upErr) {
          setError(`Could not upload ${file.name}: ${upErr.message}`);
          continue;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        added.push({ type: kind, url: data.publicUrl, name: file.name });
      }
      if (kind === "image") setPhotos((cur) => [...cur, ...added]);
      else if (added[0]) setVideo(added[0]);
    } finally {
      setBusy(false);
    }
  }

  // Video is YouTube link (if given) else the uploaded video.
  const ytValid = youtube.trim() && youtubeEmbedUrl(youtube.trim());
  const videoItem: Item | null = ytValid
    ? { type: "youtube", url: youtube.trim(), name: "YouTube video" }
    : video;

  // Media order: video/youtube first, then photos.
  const items: { type: MediaType; url: string; position: number }[] = [];
  if (videoItem) items.push({ type: videoItem.type, url: videoItem.url, position: 0 });
  photos.forEach((p, i) =>
    items.push({ type: p.type, url: p.url, position: i + 1 })
  );

  return (
    <div>
      {/* Photos */}
      <label className="block text-sm font-medium" htmlFor="photos">
        Photos (up to {MAX_PHOTOS})
      </label>
      <input
        id="photos"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => uploadFiles(e.target.files, "image")}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
      />
      {photos.length > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-16 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((cur) => cur.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Video */}
      <label className="mt-5 block text-sm font-medium" htmlFor="youtube">
        Video — paste a YouTube link
      </label>
      <input
        id="youtube"
        type="url"
        placeholder="https://youtu.be/…"
        value={youtube}
        onChange={(e) => setYoutube(e.target.value)}
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />
      {youtube.trim() && !ytValid ? (
        <p className="mt-1 text-xs text-accent">
          That doesn&rsquo;t look like a YouTube link.
        </p>
      ) : null}

      <p className="mt-3 text-sm opacity-60">— or upload a video file —</p>
      <input
        id="video"
        type="file"
        accept="video/*"
        onChange={(e) => uploadFiles(e.target.files, "video")}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
        disabled={Boolean(ytValid)}
      />
      {video && !ytValid ? (
        <p className="mt-2 text-sm text-brand">
          Video uploaded: {video.name} ✓{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => setVideo(null)}
          >
            remove
          </button>
        </p>
      ) : null}

      {busy ? <p className="mt-3 text-sm text-brand">Uploading…</p> : null}
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}

      <input type="hidden" name="media" value={JSON.stringify(items)} />
    </div>
  );
}
