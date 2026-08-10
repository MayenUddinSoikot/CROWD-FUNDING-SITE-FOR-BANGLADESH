"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCampaign } from "./actions";
import { CATEGORY_LABELS, OCCASION_LABELS } from "@/lib/types";
import type { CampaignCategory } from "@/lib/types";
import { DocumentUploader } from "@/components/DocumentUploader";
import { MediaUploader } from "@/components/MediaUploader";
import { CharityAllocator } from "@/components/CharityAllocator";
import { RELATIONSHIP_LABELS } from "@/lib/types";
import type { PublicCharity } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

function Req() {
  return <span className="text-accent" title="Required">*</span>;
}

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

const TYPE_OPTIONS: {
  key: "standard" | "occasion" | "creator";
  emoji: string;
  title: string;
  desc: string;
}[] = [
  {
    key: "standard",
    emoji: "🤝",
    title: "A fundraiser",
    desc: "Medical, education, disaster, or a cause you care about.",
  },
  {
    key: "occasion",
    emoji: "🎂",
    title: "Occasion fundraiser",
    desc: "Raise for a charity on your birthday, wedding, or anniversary.",
  },
  {
    key: "creator",
    emoji: "☕",
    title: "Creator support",
    desc: "An ongoing page — fans can “buy you a cha.”",
  },
];

// Every text/select/textarea field lives here, controlled — React's <form
// action> resets uncontrolled fields to blank once the action finishes,
// even when it finishes with a validation error. Controlled fields always
// reflect this state instead, so nothing typed is ever lost.
type Values = {
  title: string;
  category: string;
  beneficiary_name: string;
  district: string;
  organizer_name: string;
  organizer_relationship: string;
  occasion: string;
  title_bn: string;
  summary: string;
  summary_bn: string;
  story: string;
  story_bn: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_tiktok: string;
  goal_amount: string;
  duration_days: string;
  applicant_name: string;
  applicant_nid: string;
  applicant_phone: string;
  applicant_email: string;
  notes: string;
  bkash_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
};

const INITIAL_VALUES: Values = {
  title: "",
  category: "",
  beneficiary_name: "",
  district: "",
  organizer_name: "",
  organizer_relationship: "",
  occasion: "",
  title_bn: "",
  summary: "",
  summary_bn: "",
  story: "",
  story_bn: "",
  social_facebook: "",
  social_instagram: "",
  social_youtube: "",
  social_tiktok: "",
  goal_amount: "",
  duration_days: "30",
  applicant_name: "",
  applicant_nid: "",
  applicant_phone: "",
  applicant_email: "",
  notes: "",
  bkash_number: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_branch: "",
};

export function CampaignWizard({
  userId,
  charities,
}: {
  userId: string;
  charities: PublicCharity[];
}) {
  const [state, action, pending] = useActionState(createCampaign, undefined);
  const [type, setType] = useState<"standard" | "occasion" | "creator">(
    "standard"
  );
  const [creatorMode, setCreatorMode] = useState<"monthly" | "project">(
    "monthly"
  );
  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const isCreator = type === "creator";
  const isOccasion = type === "occasion";

  // Bring the error into view — on a long form it otherwise sits far
  // below the button and the page looks like it did nothing.
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state?.error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  function set<K extends keyof Values>(field: K) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  return (
    <form action={action} className="mt-8 w-full max-w-2xl text-left">
      <input
        type="hidden"
        name="campaign_type"
        value={isCreator ? "creator" : "standard"}
      />

      <Section title="Step 1 · What kind of page? · কী ধরনের">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TYPE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setType(opt.key)}
              className={`rounded-xl border p-4 text-left transition ${
                type === opt.key
                  ? "border-brand bg-brand/5 ring-1 ring-brand"
                  : "border-foreground/20 hover:border-brand/50"
              }`}
            >
              <p className="text-2xl">{opt.emoji}</p>
              <p className="mt-1 font-semibold">{opt.title}</p>
              <p className="mt-1 text-sm opacity-70">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="1. Basics · মূল তথ্য">
        <label className="block text-sm font-medium" htmlFor="title">
          {isCreator ? "Page title (English)" : "Campaign title (English)"} <Req />
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          value={values.title}
          onChange={set("title")}
          placeholder={
            isCreator
              ? "e.g. Dhaka Street Stories — monthly support"
              : isOccasion
                ? "e.g. My birthday fundraiser for clean water"
                : "e.g. Support urgent treatment for a family"
          }
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="category">
          Category · ক্যাটাগরি
        </label>
        <select
          id="category"
          name="category"
          required
          value={values.category}
          onChange={set("category")}
          className={inputClass}
        >
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
              {isCreator
                ? "Your creator / page name"
                : isOccasion
                  ? "Who / which charity you're raising for"
                  : "Beneficiary name"}{" "}
              <Req />
            </label>
            <input
              id="beneficiary_name"
              name="beneficiary_name"
              required
              value={values.beneficiary_name}
              onChange={set("beneficiary_name")}
              placeholder={
                isCreator
                  ? "e.g. Dhaka Street Stories"
                  : isOccasion
                    ? "e.g. JAAGO Foundation"
                    : "Md. Rahim Uddin"
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="district">
              District · জেলা <Req />
            </label>
            <input
              id="district"
              name="district"
              required
              value={values.district}
              onChange={set("district")}
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
                Organizer name (you) <Req />
              </label>
              <input
                id="organizer_name"
                name="organizer_name"
                required
                value={values.organizer_name}
                onChange={set("organizer_name")}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="organizer_relationship"
              >
                Relationship to beneficiary <Req />
              </label>
              <select
                id="organizer_relationship"
                name="organizer_relationship"
                required
                value={values.organizer_relationship}
                onChange={set("organizer_relationship")}
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

        {isOccasion ? (
          <div className="mt-4">
            <label className="block text-sm font-medium" htmlFor="occasion">
              Which occasion? · কোন উপলক্ষ <Req />
            </label>
            <select
              id="occasion"
              name="occasion"
              required
              value={values.occasion}
              onChange={set("occasion")}
              className={inputClass}
            >
              <option value="">Choose an occasion</option>
              {Object.entries(OCCASION_LABELS).map(([key, o]) => (
                <option key={key} value={key}>
                  {o.emoji} {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs opacity-60">
              Your friends can chip in for the charity to mark your day. 🎉
            </p>
          </div>
        ) : null}
      </Section>

      <Section title="2. Bangla title · বাংলা শিরোনাম">
        <label className="font-bengali block text-sm font-medium" htmlFor="title_bn">
          একই শিরোনাম বাংলায় <span className="font-sans">(optional)</span>
        </label>
        <input
          id="title_bn"
          name="title_bn"
          value={values.title_bn}
          onChange={set("title_bn")}
          className={`font-bengali ${inputClass}`}
          placeholder="রহিমের হার্ট সার্জারিতে সাহায্য করুন"
        />
      </Section>

      <Section title="3. Story · বিবরণ">
        <label className="block text-sm font-medium" htmlFor="summary">
          {isCreator
            ? "What content do you make? (1-2 sentences)"
            : "Short summary (1-2 sentences, English)"}{" "}
          <Req />
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={2}
          maxLength={280}
          value={values.summary}
          onChange={set("summary")}
          className={inputClass}
        />

        <label className="font-bengali mt-4 block text-sm font-medium" htmlFor="summary_bn">
          সংক্ষিপ্ত বিবরণ (বাংলা) <span className="font-sans">(optional)</span>
        </label>
        <textarea
          id="summary_bn"
          name="summary_bn"
          rows={2}
          maxLength={280}
          value={values.summary_bn}
          onChange={set("summary_bn")}
          className={`font-bengali ${inputClass}`}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="story">
          {isCreator ? "About you & your work (English)" : "Full story (English)"}{" "}
          <Req />
        </label>
        <textarea
          id="story"
          name="story"
          required
          rows={5}
          value={values.story}
          onChange={set("story")}
          className={inputClass}
        />

        <label className="font-bengali mt-4 block text-sm font-medium" htmlFor="story_bn">
          সম্পূর্ণ বিবরণ (বাংলা) <span className="font-sans">(optional)</span>
        </label>
        <textarea
          id="story_bn"
          name="story_bn"
          rows={5}
          value={values.story_bn}
          onChange={set("story_bn")}
          className={`font-bengali ${inputClass}`}
        />
      </Section>

      {isCreator ? (
        <Section
          title="3b. Social media links · সোশ্যাল লিংক (optional)"
          subtitle="Shown publicly on your page so supporters can find your work and trust who you are."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="social_facebook">
                📘 Facebook (optional)
              </label>
              <input
                id="social_facebook"
                name="social_facebook"
                type="url"
                value={values.social_facebook}
                onChange={set("social_facebook")}
                placeholder="https://facebook.com/yourpage"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="social_instagram">
                📸 Instagram (optional)
              </label>
              <input
                id="social_instagram"
                name="social_instagram"
                type="url"
                value={values.social_instagram}
                onChange={set("social_instagram")}
                placeholder="https://instagram.com/yourhandle"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="social_youtube">
                ▶️ YouTube (optional)
              </label>
              <input
                id="social_youtube"
                name="social_youtube"
                type="url"
                value={values.social_youtube}
                onChange={set("social_youtube")}
                placeholder="https://youtube.com/@yourchannel"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="social_tiktok">
                🎵 TikTok (optional)
              </label>
              <input
                id="social_tiktok"
                name="social_tiktok"
                type="url"
                value={values.social_tiktok}
                onChange={set("social_tiktok")}
                placeholder="https://tiktok.com/@yourhandle"
                className={inputClass}
              />
            </div>
          </div>
        </Section>
      ) : null}

      <Section
        title={
          isCreator
            ? "4. Support · সাপোর্ট"
            : "4. Funding goal & duration · লক্ষ্য ও সময়"
        }
      >
        {isCreator ? (
          <>
            <input type="hidden" name="creator_mode" value={creatorMode} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCreatorMode("monthly")}
                className={`rounded-xl border p-4 text-left transition ${
                  creatorMode === "monthly"
                    ? "border-brand bg-brand/5 ring-1 ring-brand"
                    : "border-foreground/20"
                }`}
              >
                <p className="font-semibold">☕ Monthly ongoing support</p>
                <p className="mt-1 text-sm opacity-70">
                  For your regular work. Runs in 30-day cycles and resets to ৳0
                  each month, then keeps going.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setCreatorMode("project")}
                className={`rounded-xl border p-4 text-left transition ${
                  creatorMode === "project"
                    ? "border-brand bg-brand/5 ring-1 ring-brand"
                    : "border-foreground/20"
                }`}
              >
                <p className="font-semibold">🎬 Special project</p>
                <p className="mt-1 text-sm opacity-70">
                  A one-time goal for a specific project (up to 30 days).
                </p>
              </button>
            </div>

            <label className="mt-4 block text-sm font-medium" htmlFor="goal_amount">
              {creatorMode === "monthly"
                ? "Monthly support target (৳ Taka)"
                : "Project goal (৳ Taka)"}{" "}
              <Req />
            </label>
            <input
              id="goal_amount"
              name="goal_amount"
              type="number"
              min={1}
              step={1}
              required
              value={values.goal_amount}
              onChange={set("goal_amount")}
              placeholder="50000"
              className={inputClass}
            />

            {creatorMode === "project" ? (
              <div className="mt-4">
                <label className="block text-sm font-medium" htmlFor="duration_days">
                  Runs for · কত দিন (max 30)
                </label>
                <select
                  id="duration_days"
                  name="duration_days"
                  value={values.duration_days}
                  onChange={set("duration_days")}
                  className={inputClass}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            ) : (
              <p className="mt-2 text-sm opacity-60">
                Runs in 30-day cycles — the amount resets to ৳0 each month and
                the page keeps going. ৩০ দিন পর পর শূন্য থেকে শুরু হয়।
              </p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="goal_amount">
                Goal amount (৳ Taka) <Req />
              </label>
              <input
                id="goal_amount"
                name="goal_amount"
                type="number"
                min={1}
                step={1}
                required
                value={values.goal_amount}
                onChange={set("goal_amount")}
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
                value={values.duration_days}
                onChange={set("duration_days")}
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
        )}
      </Section>

      <Section
        title="4b. Photos & video · ছবি ও ভিডিও"
        subtitle="At least one photo is required. Add up to 4 photos and one video (upload or a YouTube link). Shown publicly as a swipeable gallery."
      >
        <MediaUploader userId={userId} />
      </Section>

      <Section
        title="5. Verification · যাচাই (private & confidential)"
        subtitle="Never shown publicly. Our internal verification team reviews this confidentially before approving your campaign. এই তথ্য সম্পূর্ণ গোপনীয় — শুধুমাত্র আমাদের অভ্যন্তরীণ যাচাই টিম দেখে।"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_name">
              Your full name (applicant) <Req />
            </label>
            <input
              id="applicant_name"
              name="applicant_name"
              required
              value={values.applicant_name}
              onChange={set("applicant_name")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_nid">
              NID / Passport / Birth certificate number <Req />
            </label>
            <input
              id="applicant_nid"
              name="applicant_nid"
              required
              value={values.applicant_nid}
              onChange={set("applicant_nid")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_phone">
              Phone · মোবাইল <Req />
            </label>
            <input
              id="applicant_phone"
              name="applicant_phone"
              type="tel"
              required
              value={values.applicant_phone}
              onChange={set("applicant_phone")}
              placeholder="01XXXXXXXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="applicant_email">
              Email (optional)
            </label>
            <input
              id="applicant_email"
              name="applicant_email"
              type="email"
              value={values.applicant_email}
              onChange={set("applicant_email")}
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      {isOccasion ? (
        <Section
          title="6. Where the money goes · চ্যারিটি"
          subtitle="For an occasion fundraiser, funds go to verified charities — not to you."
        >
          <CharityAllocator charities={charities} />
          <label className="mt-4 block text-sm font-medium" htmlFor="notes">
            Anything else for the reviewer (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={set("notes")}
            className={inputClass}
          />
        </Section>
      ) : (
        <Section
          title="6. Payout details · পেআউট (private & confidential)"
          subtitle={
            isCreator
              ? "Where your support should be sent — this goes to you, for you and your projects. Never shown publicly — verified confidentially by our internal team. Give bKash/Nagad or bank details (at least one)."
              : "Where approved funds should be sent. Never shown publicly — verified confidentially by our internal team. Give bKash/Nagad or bank details (at least one)."
          }
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
                value={values.bkash_number}
                onChange={set("bkash_number")}
                placeholder="01XXXXXXXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="bank_name">
                Bank name
              </label>
              <input
                id="bank_name"
                name="bank_name"
                value={values.bank_name}
                onChange={set("bank_name")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="bank_account_name">
                Account holder name
              </label>
              <input
                id="bank_account_name"
                name="bank_account_name"
                value={values.bank_account_name}
                onChange={set("bank_account_name")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="bank_account_number">
                Account number
              </label>
              <input
                id="bank_account_number"
                name="bank_account_number"
                value={values.bank_account_number}
                onChange={set("bank_account_number")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="bank_branch">
                Branch (optional)
              </label>
              <input
                id="bank_branch"
                name="bank_branch"
                value={values.bank_branch}
                onChange={set("bank_branch")}
                className={inputClass}
              />
            </div>
          </div>

          {isCreator ? (
            <>
              <label className="mt-4 block text-sm font-medium" htmlFor="notes">
                What will support fund? (your projects) (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={values.notes}
                onChange={set("notes")}
                placeholder="e.g. equipment, travel for stories, a documentary series…"
                className={inputClass}
              />
            </>
          ) : (
            <>
              <label className="mt-4 block text-sm font-medium" htmlFor="notes">
                Anything else for the reviewer (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={values.notes}
                onChange={set("notes")}
                className={inputClass}
              />
            </>
          )}
        </Section>
      )}

      <Section
        title="7. Documents · কাগজপত্র (private & confidential)"
        subtitle={
          isCreator || isOccasion
            ? "One government ID is required — NID, Passport or Birth certificate — plus any supporting documents. Stored privately and reviewed confidentially by our internal verification team only."
            : "One government ID is required — NID, Passport or Birth certificate. Also upload medical reports and a bank cheque where relevant. Stored privately and reviewed confidentially by our internal verification team only."
        }
      >
        <DocumentUploader userId={userId} simple={isCreator || isOccasion} />
      </Section>

      {state?.error ? (
        <p
          ref={errorRef}
          role="alert"
          className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent"
        >
          {state.error}
        </p>
      ) : null}

      <p className="mt-4 text-sm opacity-60">
        Fields marked <Req /> are required. Your campaign is reviewed before it
        goes live — you&rsquo;ll see it under &ldquo;My campaigns&rdquo; once
        submitted.
      </p>

      <div className="mt-4 rounded-xl border border-foreground/15 bg-background p-4 text-xs leading-relaxed opacity-80">
        <p className="font-semibold">⚖️ Please note before you submit</p>
        <p className="mt-1.5">
          Shohay has full authority to remove, refuse, or cancel any campaign —
          and to freeze its funds — if any wrongdoing or fraudulent activity is
          found. An independent third-party audit is conducted at the end of
          every year, and is welcome.
        </p>
        <p className="font-bengali mt-1.5">
          কোনো অনিয়ম বা প্রতারণা পাওয়া গেলে সহায় যেকোনো ক্যাম্পেইন সরিয়ে
          দেওয়ার, প্রত্যাখ্যান বা বাতিল করার এবং তহবিল ফ্রিজ করার পূর্ণ
          কর্তৃত্ব রাখে। প্রতি বছর শেষে স্বাধীন তৃতীয় পক্ষের নিরীক্ষা (অডিট)
          করা হয়।
        </p>
      </div>

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
