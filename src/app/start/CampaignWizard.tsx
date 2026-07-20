"use client";

import { useActionState } from "react";
import { createCampaign } from "./actions";
import { CATEGORY_LABELS } from "@/lib/types";
import type { CampaignCategory } from "@/lib/types";
import { DocumentUploader } from "@/components/DocumentUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { RELATIONSHIP_LABELS } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6">
      <h2 className="text-sm font-bold text-brand">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-xs leading-relaxed opacity-60">{subtitle}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CampaignWizard({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(createCampaign, undefined);

  return (
    <form action={action} className="mt-8 w-full max-w-2xl text-left">
      <Section title="1. Basics · মূল তথ্য">
        <label className="block text-sm font-medium" htmlFor="title">
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
          {(
            Object.entries(CATEGORY_LABELS) as [
              CampaignCategory,
              (typeof CATEGORY_LABELS)[CampaignCategory],
            ][]
          ).map(([key, label]) => (
            <option key={key} value={key}>
              {label.en} · {label.bn}
            </option>
          ))}
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

        <div className="mt-4 rounded-xl border border-foreground/10 bg-background p-4">
          <p className="text-sm font-semibold">
            Who is raising this? · কে সংগ্রহ করছেন{" "}
            <span className="opacity-60">(shown publicly)</span>
          </p>
          <p className="mt-1 text-xs opacity-60">
            If you&rsquo;re raising for someone else — a family member, a
            friend, a well-wisher, or an institution like a school.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="organizer_name">
                Organizer name (you)
              </label>
              <input
                id="organizer_name"
                name="organizer_name"
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="organizer_relationship"
              >
                Relationship to beneficiary
              </label>
              <select
                id="organizer_relationship"
                name="organizer_relationship"
                defaultValue=""
                className={inputClass}
              >
                <option value="">Choose…</option>
                {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
          A public photo for the campaign card (starts with https://).
        </p>
      </Section>

      <Section title="2. Bangla title · বাংলা শিরোনাম">
        <label className="font-bengali block text-sm font-medium" htmlFor="title_bn">
          একই শিরোনাম বাংলায় (ঐচ্ছিক)
        </label>
        <input
          id="title_bn"
          name="title_bn"
          className={`font-bengali ${inputClass}`}
          placeholder="রহিমের হার্ট সার্জারিতে সাহায্য করুন"
        />
      </Section>

      <Section title="3. Story · বিবরণ">
        <label className="block text-sm font-medium" htmlFor="summary">
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
      </Section>

      <Section title="4. Funding goal & duration · লক্ষ্য ও সময়">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="goal_amount">
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
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="duration_days">
              Runs for · কত দিন
            </label>
            <select
              id="duration_days"
              name="duration_days"
              defaultValue="30"
              className={inputClass}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </Section>

      <Section
        title="4b. Video message · ভিডিও (optional)"
        subtitle="A short video appeal shown publicly on the campaign page."
      >
        <VideoUploader userId={userId} />
      </Section>

      <Section
        title="5. Verification · যাচাই (private — admin only)"
        subtitle="This section is never shown publicly. Shohay uses it to verify the campaign before approving. এই তথ্য কখনো প্রকাশ্যে দেখানো হয় না।"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_name">
              Your full name (applicant)
            </label>
            <input id="applicant_name" name="applicant_name" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_nid">
              Your NID number · জাতীয় পরিচয়পত্র
            </label>
            <input id="applicant_nid" name="applicant_nid" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_phone">
              Phone · মোবাইল
            </label>
            <input
              id="applicant_phone"
              name="applicant_phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_email">
              Email
            </label>
            <input
              id="applicant_email"
              name="applicant_email"
              type="email"
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <Section
        title="6. Payout details · পেআউট (private — admin only)"
        subtitle="Where approved funds should be sent. Also never shown publicly."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="bkash_number">
              bKash / Nagad number
            </label>
            <input
              id="bkash_number"
              name="bkash_number"
              type="tel"
              placeholder="01XXXXXXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="bank_name">
              Bank name
            </label>
            <input id="bank_name" name="bank_name" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="bank_account_name">
              Account holder name
            </label>
            <input id="bank_account_name" name="bank_account_name" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="bank_account_number">
              Account number
            </label>
            <input id="bank_account_number" name="bank_account_number" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="bank_branch">
              Branch
            </label>
            <input id="bank_branch" name="bank_branch" className={inputClass} />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="notes">
          Anything else for the reviewer
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
      </Section>

      <Section
        title="7. Documents · কাগজপত্র (private — admin only)"
        subtitle="Upload photos or PDFs of the NID, medical reports, and bank cheque so Shohay can verify. Stored privately — only admins can open them."
      >
        <DocumentUploader userId={userId} />
      </Section>

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
