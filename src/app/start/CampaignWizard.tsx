"use client";

import { useActionState } from "react";
import { createCampaign } from "./actions";
import { CATEGORY_LABELS } from "@/lib/types";
import type { CampaignCategory } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

export function CampaignWizard() {
  const [state, action, pending] = useActionState(createCampaign, undefined);

  return (
    <form action={action} className="mt-10 w-full max-w-2xl text-left">
      <fieldset className="rounded-2xl border border-foreground/10 bg-card p-6">
        <legend className="px-1 text-sm font-bold text-brand">
          1. Basics · মূল তথ্য
        </legend>

        <label className="mt-2 block text-sm font-medium" htmlFor="title">
          Campaign title (English)
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="Help Rahim get heart surgery"
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="category">
          Category · ক্যাটাগরি
        </label>
        <select id="category" name="category" required className={inputClass}>
          <option value="">Choose a category</option>
          {(Object.entries(CATEGORY_LABELS) as [CampaignCategory, (typeof CATEGORY_LABELS)[CampaignCategory]][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label.en} · {label.bn}
              </option>
            )
          )}
        </select>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="beneficiary_name">
              Beneficiary name
            </label>
            <input
              id="beneficiary_name"
              name="beneficiary_name"
              placeholder="Md. Rahim Uddin"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="district">
              District · জেলা
            </label>
            <input
              id="district"
              name="district"
              placeholder="Jashore"
              className={inputClass}
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="cover_image_url">
          Cover image link (optional)
        </label>
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          placeholder="https://…"
          className={inputClass}
        />
        <p className="mt-1 text-xs opacity-60">
          Paste a link to a photo (starting with https://). Direct photo
          uploads are coming soon.
        </p>
      </fieldset>

      <fieldset className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <legend className="px-1 text-sm font-bold text-brand">
          2. Bangla title · বাংলা শিরোনাম
        </legend>
        <label className="font-bengali mt-2 block text-sm font-medium" htmlFor="title_bn">
          একই শিরোনাম বাংলায় (ঐচ্ছিক)
        </label>
        <input
          id="title_bn"
          name="title_bn"
          className={`font-bengali ${inputClass}`}
          placeholder="রহিমের হার্ট সার্জারিতে সাহায্য করুন"
        />
      </fieldset>

      <fieldset className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <legend className="px-1 text-sm font-bold text-brand">
          3. Story · বিবরণ
        </legend>

        <label className="mt-2 block text-sm font-medium" htmlFor="summary">
          Short summary (1-2 sentences, English)
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          maxLength={280}
          className={inputClass}
        />

        <label className="font-bengali mt-4 block text-sm font-medium" htmlFor="summary_bn">
          সংক্ষিপ্ত বিবরণ (বাংলা)
        </label>
        <textarea
          id="summary_bn"
          name="summary_bn"
          rows={2}
          maxLength={280}
          className={`font-bengali ${inputClass}`}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="story">
          Full story (English)
        </label>
        <textarea id="story" name="story" rows={5} className={inputClass} />

        <label className="font-bengali mt-4 block text-sm font-medium" htmlFor="story_bn">
          সম্পূর্ণ বিবরণ (বাংলা)
        </label>
        <textarea
          id="story_bn"
          name="story_bn"
          rows={5}
          className={`font-bengali ${inputClass}`}
        />
      </fieldset>

      <fieldset className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <legend className="px-1 text-sm font-bold text-brand">
          4. Funding goal · লক্ষ্যমাত্রা
        </legend>
        <label className="mt-2 block text-sm font-medium" htmlFor="goal_amount">
          Goal amount (৳ Taka)
        </label>
        <input
          id="goal_amount"
          name="goal_amount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="350000"
          className={inputClass}
        />
      </fieldset>

      {state?.error ? (
        <p className="mt-4 text-sm text-accent">{state.error}</p>
      ) : null}

      <p className="mt-4 text-sm opacity-60">
        Your campaign is reviewed before it goes live — you&rsquo;ll see it
        under &ldquo;My campaigns&rdquo; once submitted.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review · পর্যালোচনার জন্য জমা দিন"}
      </button>
    </form>
  );
}
