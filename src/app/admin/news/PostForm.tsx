"use client";

import { useActionState } from "react";
import { createPost } from "./actions";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

export function PostForm() {
  const [state, action, pending] = useActionState(createPost, undefined);

  return (
    <form action={action} className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-sm font-bold text-brand">Write a post</p>

      <label className="mt-3 block text-sm font-medium" htmlFor="title">
        Title (English)
      </label>
      <input id="title" name="title" required className={inputClass} />

      <label className="mt-3 block font-bengali text-sm font-medium" htmlFor="title_bn">
        শিরোনাম (বাংলা)
      </label>
      <input id="title_bn" name="title_bn" className={`font-bengali ${inputClass}`} />

      <label className="mt-3 block text-sm font-medium" htmlFor="cover_image_url">
        Cover image URL (optional)
      </label>
      <input id="cover_image_url" name="cover_image_url" type="url" className={inputClass} />

      <label className="mt-3 block text-sm font-medium" htmlFor="excerpt">
        Short excerpt
      </label>
      <input id="excerpt" name="excerpt" maxLength={200} className={inputClass} />

      <label className="mt-3 block text-sm font-medium" htmlFor="body">
        Body (English)
      </label>
      <textarea id="body" name="body" rows={6} className={inputClass} />

      <label className="mt-3 block font-bengali text-sm font-medium" htmlFor="body_bn">
        বিবরণ (বাংলা)
      </label>
      <textarea id="body_bn" name="body_bn" rows={6} className={`font-bengali ${inputClass}`} />

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked className="h-4 w-4" />
        Publish now (uncheck to save as draft)
      </label>

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}
      {state?.created ? (
        <p className="mt-3 text-sm text-brand">Post saved ✓</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save post"}
      </button>
    </form>
  );
}
