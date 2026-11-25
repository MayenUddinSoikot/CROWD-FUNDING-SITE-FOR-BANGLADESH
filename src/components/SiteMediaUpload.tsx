"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/* Pick a photo or video from the computer and put it straight into
   Shohay's own storage.

   Before this, the only way to add homepage media was to paste a link
   to a file hosted somewhere else — which meant the homepage depended
   on a host nobody here controls. When that link went away, so did the
   hero. Uploaded files live in Shohay's bucket and stay. */

const BUCKET = "site-media";
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 100;

function extensionOf(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "dat";
}

export function SiteMediaUpload({
  value,
  onChange,
  onKindChange,
}: {
  value: string;
  onChange: (url: string) => void;
  onKindChange?: (kind: "image" | "video") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Choose a photo or a video file.");
      return;
    }
    const limit = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > limit * 1024 * 1024) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is ${limit} MB — try a shorter clip or a smaller photo.`
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `homepage/${crypto.randomUUID()}.${extensionOf(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr) {
        setError(
          /row-level security|not authorized|Unauthorized/i.test(upErr.message)
            ? "Upload refused. Run supabase/site-theme.sql once, and make sure you are signed in as an admin."
            : `Could not upload: ${upErr.message}`
        );
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      onKindChange?.(isVideo ? "video" : "image");
      setName(file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload that file."
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(value);

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="press inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Uploading…" : "📤 Choose a file"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setName(null);
            }}
            className="press text-sm font-semibold text-muted hover:text-accent"
          >
            Remove
          </button>
        ) : null}
        <span className="text-xs text-muted">
          Photo up to {MAX_IMAGE_MB} MB, video up to {MAX_VIDEO_MB} MB
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
        >
          {error}
        </p>
      ) : null}

      {value ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-foreground/10">
          <div className="aspect-video w-full bg-background">
            {isVideo ? (
              <video
                src={value}
                muted
                loop
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <p className="truncate px-3 py-2 text-xs text-muted">
            {name ?? value}
          </p>
        </div>
      ) : null}
    </div>
  );
}
