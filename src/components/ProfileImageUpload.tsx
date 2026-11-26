"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/* Pick a photo from your phone and put it on your creator page.

   Before this, the only way to set a profile or cover picture was to
   paste a web address — which assumes you already have your photo
   hosted somewhere. Almost nobody does. The photo is on their phone. */

const BUCKET = "campaign-media";
const MAX_MB = 10;

function extensionOf(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "jpg";
}

export function ProfileImageUpload({
  userId,
  value,
  onChange,
  shape = "wide",
  label,
}: {
  userId: string;
  value: string;
  onChange: (url: string) => void;
  shape?: "round" | "wide";
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Choose a photo — a JPG or PNG from your phone or computer.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(
        `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_MB} MB.`
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      /* The folder must be your own user id — that is what the storage
         rule checks, so nobody can write into anyone else's folder. */
      const path = `${userId}/profile-${crypto.randomUUID()}.${extensionOf(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });

      if (upErr) {
        setError(
          /row-level security|Unauthorized|not authorized/i.test(upErr.message)
            ? "Upload refused — please log out and back in, then try again."
            : `Could not upload: ${upErr.message}`
        );
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="mt-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div className="flex items-center gap-4">
        {value ? (
          <span
            className={`block shrink-0 overflow-hidden bg-brand-tint ${
              shape === "round"
                ? "h-16 w-16 rounded-full"
                : "h-16 w-28 rounded-xl"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
        ) : (
          <span
            className={`flex shrink-0 items-center justify-center bg-brand-tint text-xl text-brand-dark ${
              shape === "round"
                ? "h-16 w-16 rounded-full"
                : "h-16 w-28 rounded-xl"
            }`}
            aria-hidden="true"
          >
            {shape === "round" ? "🙂" : "🖼️"}
          </span>
        )}

        <div className="min-w-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="press inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Uploading…" : value ? `Change ${label}` : `Upload ${label}`}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="press ml-3 text-sm font-semibold text-muted hover:text-accent"
            >
              Remove
            </button>
          ) : null}
          <p className="mt-1 text-xs text-muted">JPG or PNG, up to {MAX_MB} MB</p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
