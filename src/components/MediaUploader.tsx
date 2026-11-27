"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { MediaType } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/types";
import { inputClass } from "@/components/ui";

const BUCKET = "campaign-media";
const DEFAULT_MAX_PHOTOS = 6;
const MAX_PHOTO_MB = 15;
const MAX_VIDEO_MB = 100;

type Item = { type: MediaType; url: string; name: string };

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "dat";
}

export function MediaUploader({
  userId,
  maxPhotos = DEFAULT_MAX_PHOTOS,
}: {
  userId: string;
  /* A creator's special project gets a bigger gallery — showing the work
     is most of what persuades their own audience to fund it. */
  maxPhotos?: number;
}) {
  const [photos, setPhotos] = useState<Item[]>([]);
  const [video, setVideo] = useState<Item | null>(null);
  const [youtube, setYoutube] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[] | null, kind: "image" | "video") {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const added: Item[] = [];
      const limitMb = kind === "image" ? MAX_PHOTO_MB : MAX_VIDEO_MB;

      for (const file of list) {
        if (kind === "image" && photos.length + added.length >= maxPhotos) {
          setError(`You can add up to ${maxPhotos} photos.`);
          break;
        }
        if (!file.type.startsWith(kind === "image" ? "image/" : "video/")) {
          setError(
            kind === "image"
              ? `${file.name} isn't a photo.`
              : `${file.name} isn't a video.`
          );
          continue;
        }
        if (file.size > limitMb * 1024 * 1024) {
          setError(`${file.name} is larger than ${limitMb} MB.`);
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

  function move(from: number, to: number) {
    setPhotos((cur) => {
      if (to < 0 || to >= cur.length) return cur;
      const next = [...cur];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const images = files.filter((f) => f.type.startsWith("image/"));
    const videos = files.filter((f) => f.type.startsWith("video/"));
    if (images.length) uploadFiles(images, "image");
    if (videos.length) uploadFiles(videos.slice(0, 1), "video");
  }

  const ytValid = youtube.trim() && youtubeEmbedUrl(youtube.trim());
  const videoItem: Item | null = ytValid
    ? { type: "youtube", url: youtube.trim(), name: "YouTube video" }
    : video;

  // Video first, then photos in the order the campaigner arranged them.
  const items: { type: MediaType; url: string; position: number }[] = [];
  if (videoItem) items.push({ type: videoItem.type, url: videoItem.url, position: 0 });
  photos.forEach((p, i) => items.push({ type: p.type, url: p.url, position: i + 1 }));

  return (
    <div>
      {/* ---------- Photos ---------- */}
      <p className="text-sm font-bold">
        Photos <span className="font-medium text-muted">· up to {maxPhotos}</span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        A clear photo of the person or the situation raises far more than a
        stock image. The first photo is the one donors see everywhere.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`press mt-3 rounded-2xl border-2 border-dashed p-6 text-center ${
          dragging
            ? "border-brand bg-brand-tint"
            : "border-foreground/15 bg-background"
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-dark"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.8" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        <p className="mt-3 text-sm font-semibold">
          Drag photos here, or choose from your phone
        </p>
        <p className="mt-1 text-xs text-muted">
          JPG, PNG or WEBP · up to {MAX_PHOTO_MB} MB each
        </p>

        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={busy || photos.length >= maxPhotos}
          className="press mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-brand hover:bg-brand-dark disabled:opacity-60"
        >
          {photos.length >= maxPhotos ? "Photo limit reached" : "Choose photos"}
        </button>

        <input
          ref={photoInput}
          id="photos"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            uploadFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />
      </div>

      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li
              key={p.url}
              className="group relative overflow-hidden rounded-xl bg-foreground/5 shadow-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />

              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
                  Main photo
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move photo ${i + 1} earlier`}
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-foreground disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} later`}
                    className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-foreground disabled:opacity-40"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((cur) => cur.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove photo ${i + 1}`}
                  className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-accent"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* ---------- Video ---------- */}
      <div className="mt-7 border-t border-foreground/10 pt-6">
        <p className="text-sm font-bold">
          Video <span className="font-medium text-muted">· optional</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          A short phone video of the person speaking builds more trust than
          anything else you can add.
        </p>

        <label className="mt-3 block text-sm font-medium" htmlFor="youtube">
          Paste a YouTube link
        </label>
        <input
          id="youtube"
          type="url"
          inputMode="url"
          placeholder="https://youtu.be/…"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          className={inputClass}
        />
        {youtube.trim() && !ytValid ? (
          <p className="mt-1.5 text-xs font-medium text-accent-ink">
            That doesn&rsquo;t look like a YouTube link.
          </p>
        ) : null}

        {ytValid ? (
          <div className="mt-3 aspect-video overflow-hidden rounded-xl shadow-soft">
            <iframe
              src={youtubeEmbedUrl(youtube.trim()) ?? ""}
              title="Video preview"
              allowFullScreen
              className="h-full w-full bg-black"
            />
          </div>
        ) : (
          <>
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              or upload a video file
            </p>
            <label
              htmlFor="video"
              className="press mt-2 flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-foreground/15 bg-card px-5 py-3 text-sm font-bold hover:border-brand hover:text-brand"
            >
              {video ? "Choose a different video" : "Choose a video"}
            </label>
            <input
              id="video"
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                uploadFiles(e.target.files, "video");
                e.target.value = "";
              }}
            />
            <p className="mt-1.5 text-center text-xs text-muted">
              MP4 or MOV · up to {MAX_VIDEO_MB} MB
            </p>

            {video ? (
              <div className="mt-3 overflow-hidden rounded-xl shadow-soft">
                <video
                  src={video.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                />
                <div className="flex items-center justify-between gap-3 bg-card px-4 py-2.5">
                  <span className="truncate text-xs font-medium text-muted">
                    {video.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="press shrink-0 text-xs font-bold text-accent hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {busy ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          Uploading…
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink">
          {error}
        </p>
      ) : null}

      {/* Submitted with the form; the server action reads this. */}
      <input type="hidden" name="media" value={JSON.stringify(items)} />
    </div>
  );
}
