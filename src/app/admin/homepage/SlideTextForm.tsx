"use client";

import { useActionState, useState } from "react";
import { updateSiteMedia } from "./actions";
import { Button, inputClass } from "@/components/ui";

/* The words on one slide, editable after it is on the page. */

export function SlideTextForm({
  id,
  title,
  titleBn,
  subtitle,
  linkUrl,
  position,
  kind,
}: {
  id: string;
  title: string | null;
  titleBn: string | null;
  subtitle: string | null;
  linkUrl: string | null;
  position: number;
  kind: "hero" | "faces" | "featured";
}) {
  const [state, action, pending] = useActionState(updateSiteMedia, undefined);
  const [open, setOpen] = useState(false);

  const [t, setT] = useState(title ?? "");
  const [bn, setBn] = useState(titleBn ?? "");
  const [sub, setSub] = useState(subtitle ?? "");
  const [link, setLink] = useState(linkUrl ?? "");
  const [pos, setPos] = useState(String(position ?? 0));

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Edit words
      </Button>
    );
  }

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="id" value={id} />

      <label className="block text-xs font-semibold">
        {kind === "hero"
          ? "Headline on this slide"
          : kind === "faces"
            ? "Name shown on the photo"
            : "Title"}
      </label>
      <input
        name="title"
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder={
          kind === "hero"
            ? "Leave empty to use the homepage headline"
            : kind === "faces"
              ? "Leave empty for no name on the photo"
              : ""
        }
        className={inputClass}
      />

      {kind === "hero" ? (
        <>
          <label className="mt-3 block text-xs font-semibold">
            Bengali line on this slide
          </label>
          <input
            name="title_bn"
            value={bn}
            onChange={(e) => setBn(e.target.value)}
            placeholder="Leave empty for none"
            className={`font-bengali ${inputClass}`}
          />
        </>
      ) : null}

      <label className="mt-3 block text-xs font-semibold">
        {kind === "hero"
          ? "Credit line under the headline"
          : kind === "faces"
            ? "Photo credit (small text on the photo)"
            : "Caption"}
      </label>
      <input
        name="subtitle"
        value={sub}
        onChange={(e) => setSub(e.target.value)}
        className={inputClass}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
        <div>
          <label className="block text-xs font-semibold">
            Link (optional)
          </label>
          <input
            name="link_url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/campaigns"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold">Order</label>
          <input
            name="position"
            type="number"
            value={pos}
            onChange={(e) => setPos(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-tint px-3 py-2 text-xs font-medium text-accent-ink"
        >
          {state.error}
        </p>
      ) : null}
      {state?.saved ? (
        <p className="mt-3 rounded-xl bg-brand-tint px-3 py-2 text-xs font-semibold text-brand-dark">
          Saved.
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save words"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
      </div>
    </form>
  );
}
