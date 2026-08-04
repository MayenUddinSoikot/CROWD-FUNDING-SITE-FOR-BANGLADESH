"use client";

import { useState } from "react";
import { useActionState } from "react";
import { postUpdate } from "@/app/campaigns/[slug]/update-actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const MEDIA_BUCKET = "campaign-media";

export function CampaignUpdateForm({
  campaignId,
  slug,
}: {
  campaignId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState(postUpdate, undefined);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhoto(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Photo is larger than 10 MB.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = /\.([a-zA-Z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "jpg";
      const path = `updates/${campaignId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-brand/30 bg-brand/5 p-4"
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="image_url" value={imageUrl} />

      <label className="block text-sm font-medium" htmlFor="body">
        Post an update · আপডেট দিন
      </label>
      <textarea
        id="body"
        name="body"
        rows={3}
        required
        placeholder="e.g. The hospital bed is booked — thank you all!"
        className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium opacity-70" htmlFor="update-photo">
            Add a photo (optional)
          </label>
          <input
            id="update-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePhoto(e.target.files)}
            className="mt-1 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
          />
          {uploading ? (
            <p className="mt-1 text-xs text-brand">Uploading…</p>
          ) : imageUrl ? (
            <p className="mt-1 text-xs text-brand">Photo attached ✓</p>
          ) : null}
          {uploadError ? (
            <p className="mt-1 text-xs text-accent">{uploadError}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-xs font-medium opacity-70" htmlFor="video_url">
            Video link (optional)
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            placeholder="https://youtube.com/watch?v=…"
            className="mt-1 w-full rounded-xl border border-foreground/20 bg-card px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-2 text-sm text-accent">{state.error}</p>
      ) : null}
      {state?.posted ? (
        <p className="mt-2 text-sm text-brand">Update posted ✓</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || uploading}
        className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post update"}
      </button>
    </form>
  );
}
