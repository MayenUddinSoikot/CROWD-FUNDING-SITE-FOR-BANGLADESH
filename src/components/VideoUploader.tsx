"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const BUCKET = "campaign-media";

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "mp4";
}

export function VideoUploader({ userId }: { userId: string }) {
  const [url, setUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("Video must be under 50 MB. Try a shorter clip.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `${userId}/${crypto.randomUUID()}.${extensionOf(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setError(`Could not upload: ${upErr.message}`);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
      setFileName(file.name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor="video-file">
        Video message (optional)
      </label>
      <input
        id="video-file"
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={(e) => handleFile(e.target.files)}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
      />
      <p className="mt-1 text-xs opacity-60">
        A short appeal video shown on the campaign (photo or PDF go under
        Documents). Under 50 MB.
      </p>

      {busy ? <p className="mt-2 text-sm text-brand">Uploading video…</p> : null}
      {error ? <p className="mt-2 text-sm text-accent">{error}</p> : null}
      {url ? (
        <div className="mt-3">
          <p className="text-sm text-brand">Uploaded: {fileName} ✓</p>
          <video
            src={url}
            controls
            className="mt-2 w-full rounded-xl border border-foreground/10"
          />
        </div>
      ) : null}

      <input type="hidden" name="video_url" value={url} />
    </div>
  );
}
