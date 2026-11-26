"use client";

import { useActionState, useState } from "react";
import { saveHomepageText } from "./content-actions";
import { Button, Card, inputClass } from "@/components/ui";
import type { FieldGroup } from "@/lib/homepage-fields";

/* One group of homepage wording, with its own Save button.

   Each box starts on whatever is live — the saved value, or the wording
   shipped in the code when nothing is saved. Emptying a box and saving
   puts the shipped wording back, which is said on the form so nobody
   has to guess. */

export function ContentEditor({
  group,
  saved,
}: {
  group: FieldGroup;
  saved: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(saveHomepageText, undefined);
  const mine = state?.section === group.section;

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      group.fields.map((f) => [f.key, saved[f.key] ?? f.fallback])
    )
  );

  const set = (key: string, v: string) =>
    setValues((cur) => ({ ...cur, [key]: v }));

  return (
    <form action={action}>
      <input type="hidden" name="__section" value={group.section} />

      <div className="space-y-4">
        {group.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium" htmlFor={field.key}>
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                id={field.key}
                name={field.key}
                rows={3}
                value={values[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                className={`${inputClass} min-h-[88px]`}
              />
            ) : (
              <input
                id={field.key}
                name={field.key}
                value={values[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                className={inputClass}
              />
            )}
            {field.hint ? (
              <p className="mt-1 text-xs text-muted">{field.hint}</p>
            ) : null}
            {!field.hint &&
            field.fallback &&
            values[field.key] !== field.fallback ? (
              <button
                type="button"
                onClick={() => set(field.key, field.fallback)}
                className="press mt-1 text-xs font-semibold text-brand"
              >
                Put the original wording back
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {mine && state?.error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
        >
          {state.error}
        </p>
      ) : null}
      {mine && state?.saved ? (
        <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">
          Saved — the homepage is updated.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-5">
        {pending ? "Saving…" : "Save this section"}
      </Button>
    </form>
  );
}

export function SectionCard({
  group,
  saved,
  visible,
  toggle,
}: {
  group: FieldGroup;
  saved: Record<string, string>;
  visible: boolean;
  toggle: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold">
            {group.title}
            {!visible ? (
              <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-bold text-muted">
                hidden
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {group.blurb}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {group.canHide ? toggle : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="press rounded-full border border-foreground/15 px-4 py-2 text-xs font-bold"
          >
            {open ? "Close" : "Edit words"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-5 border-t border-foreground/10 pt-5">
          <ContentEditor group={group} saved={saved} />
        </div>
      ) : null}
    </Card>
  );
}
