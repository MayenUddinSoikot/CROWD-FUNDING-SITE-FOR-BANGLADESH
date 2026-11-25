"use client";

import { useActionState, useState } from "react";
import { addSiteMedia } from "./actions";
import { Button, Card, inputClass } from "@/components/ui";
import { SiteMediaUpload } from "@/components/SiteMediaUpload";

export function SiteMediaForm() {
  const [state, action, pending] = useActionState(addSiteMedia, undefined);

  // Controlled so a validation error never wipes what was typed.
  const [slot, setSlot] = useState("featured");
  const [mediaType, setMediaType] = useState("image");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Clear once, only after a successful save.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state?.saved) {
      setUrl("");
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <form action={action}>
        <h2 className="text-sm font-bold text-brand">Add a photo or video</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Choose a file from this computer and it is uploaded to Shohay&rsquo;s
          own storage. Pasting a link to someone else&rsquo;s host still
          works, but if that host removes the file the homepage loses it.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="slot">
              Where it goes
            </label>
            <select
              id="slot"
              name="slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={inputClass}
            >
              <option value="featured">Stories strip (several)</option>
              <option value="hero">Hero — beside the headline (one)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="media_type">
              Type
            </label>
            <select
              id="media_type"
              name="media_type"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className={inputClass}
            >
              <option value="image">Photo</option>
              <option value="youtube">YouTube video</option>
              <option value="video">Uploaded video file</option>
            </select>
          </div>
        </div>

        {/* Upload first, link second: the file you own is the safer one */}
        {mediaType === "youtube" ? null : (
          <div className="mt-5">
            <span className="block text-sm font-medium">
              Upload a photo or video
            </span>
            <div className="mt-2">
              <SiteMediaUpload
                value={url}
                onChange={setUrl}
                onKindChange={setMediaType}
              />
            </div>
          </div>
        )}

        <label className="mt-5 block text-sm font-medium" htmlFor="url">
          {mediaType === "youtube"
            ? "YouTube link"
            : "…or paste a link instead"}
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            mediaType === "youtube"
              ? "https://youtu.be/…"
              : "https://…/photo.jpg"
          }
          className={inputClass}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="title">
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Flood relief in Sylhet"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="link_url">
              Button link (optional)
            </label>
            <input
              id="link_url"
              name="link_url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/campaigns/sample-flood-relief"
              className={inputClass}
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="subtitle">
          Short caption (optional)
        </label>
        <textarea
          id="subtitle"
          name="subtitle"
          rows={2}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className={inputClass}
        />

        {state?.error ? (
          <p className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink">
            {state.error}
          </p>
        ) : null}
        {state?.saved ? (
          <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-dark">
            Added — it&rsquo;s on the homepage now.
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="mt-5">
          {pending ? "Saving…" : "Add to homepage"}
        </Button>
      </form>
    </Card>
  );
}
