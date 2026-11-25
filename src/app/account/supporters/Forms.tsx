"use client";

import { useActionState, useState } from "react";
import { addTier, addPost } from "./actions";
import { Button, inputClass } from "@/components/ui";

/* Both forms keep every field controlled: React clears uncontrolled
   inputs once an action finishes, including when it finishes with an
   error, which would wipe what the creator just typed. */

function Notice({ state }: { state: { error?: string; done?: string } | undefined }) {
  if (state?.error) {
    return (
      <p
        className="mt-3 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
        role="alert"
      >
        {state.error}
      </p>
    );
  }
  if (state?.done) {
    return (
      <p className="mt-3 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">
        {state.done}
      </p>
    );
  }
  return null;
}

export function TierForm() {
  const [state, action, pending] = useActionState(addTier, undefined);
  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [amount, setAmount] = useState("200");
  const [perks, setPerks] = useState("");

  return (
    <form action={action}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="tier-name">
            Tier name
          </label>
          <input
            id="tier-name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cha club"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="tier-amount">
            Taka per month
          </label>
          <input
            id="tier-amount"
            name="amount"
            type="number"
            min={10}
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-3 block text-sm font-semibold" htmlFor="tier-bn">
        Name in Bengali (optional)
      </label>
      <input
        id="tier-bn"
        name="name_bn"
        value={nameBn}
        onChange={(e) => setNameBn(e.target.value)}
        className={`font-bengali ${inputClass}`}
      />

      <label className="mt-3 block text-sm font-semibold" htmlFor="tier-perks">
        What supporters get (optional)
      </label>
      <textarea
        id="tier-perks"
        name="perks"
        rows={3}
        maxLength={500}
        value={perks}
        onChange={(e) => setPerks(e.target.value)}
        placeholder={"Your name on my page\nSupporters-only posts"}
        className={inputClass}
      />

      <Notice state={state} />

      <Button type="submit" disabled={pending} className="mt-4">
        {pending ? "Saving…" : "Add tier"}
      </Button>
    </form>
  );
}

export function PostForm() {
  const [state, action, pending] = useActionState(addPost, undefined);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [membersOnly, setMembersOnly] = useState(false);

  return (
    <form action={action}>
      <label className="block text-sm font-semibold" htmlFor="post-title">
        Title
      </label>
      <input
        id="post-title"
        name="title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-semibold" htmlFor="post-body">
        What do you want to say?
      </label>
      <textarea
        id="post-body"
        name="body"
        rows={5}
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={inputClass}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="post-image">
            Photo link (optional)
          </label>
          <input
            id="post-image"
            name="image_url"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="post-video">
            Video or YouTube link (optional)
          </label>
          <input
            id="post-video"
            name="video_url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="members_only"
          checked={membersOnly}
          onChange={(e) => setMembersOnly(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          Supporters only
          <span className="block text-xs text-muted">
            Only people paying you monthly can read it. Leave unticked and it
            shows on your public creator page.
          </span>
        </span>
      </label>

      <Notice state={state} />

      <Button type="submit" disabled={pending} className="mt-4">
        {pending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
