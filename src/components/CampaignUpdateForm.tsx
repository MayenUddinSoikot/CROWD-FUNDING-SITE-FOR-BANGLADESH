"use client";

import { useActionState } from "react";
import { postUpdate } from "@/app/campaigns/[slug]/update-actions";

export function CampaignUpdateForm({
  campaignId,
  slug,
}: {
  campaignId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState(postUpdate, undefined);

  return (
    <form
      action={action}
      className="rounded-2xl border border-brand/30 bg-brand/5 p-4"
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
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
      {state?.error ? (
        <p className="mt-2 text-sm text-accent">{state.error}</p>
      ) : null}
      {state?.posted ? (
        <p className="mt-2 text-sm text-brand">Update posted ✓</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post update"}
      </button>
    </form>
  );
}
