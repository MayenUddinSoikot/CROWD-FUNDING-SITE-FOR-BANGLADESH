"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCampaign } from "./actions";
import { CATEGORY_LABELS, OCCASION_LABELS } from "@/lib/types";
import type { CampaignCategory } from "@/lib/types";
import Link from "next/link";
import { DocumentUploader } from "@/components/DocumentUploader";
import { MediaUploader } from "@/components/MediaUploader";
import { CharityAllocator } from "@/components/CharityAllocator";
import { RELATIONSHIP_LABELS } from "@/lib/types";
import type { PublicCharity } from "@/lib/types";
import { ACCOUNT_KINDS, accountKind } from "@/lib/account-kind";
import type { AccountKind } from "@/lib/account-kind";
import type { KnownDetails } from "./page";

const inputClass =
  "field-ring mt-1 w-full rounded-xl border border-foreground/15 bg-card px-4 py-3 text-base outline-none";

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
    <section className="mt-5 rounded-2xl bg-card p-5 shadow-soft sm:p-7">
      <h2 className="text-sm font-bold text-brand">{title}</h2>
      {subtitle ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{subtitle}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

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
  kind,
  known,
  profileName,
}: {
  userId: string;
  charities: PublicCharity[];
  kind: AccountKind;
  /* Set when this person has been verified on an earlier campaign. */
  known: KnownDetails | null;
  profileName: string;
}) {
  const [state, action, pending] = useActionState(createCampaign, undefined);
  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const info = accountKind(kind);
  const isCreator = kind === "creator";
  const isOccasion = kind === "occasion";
  const reusing = known !== null;
  const thing = info.noun;

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
      <input type="hidden" name="account_kind" value={kind} />
      <input
        type="hidden"
        name="campaign_type"
        value={isCreator ? "creator" : "standard"}
      />
      <input type="hidden" name="reuse_details" value={reusing ? "1" : "0"} />

      <p className="rounded-2xl bg-brand-tint px-5 py-4 text-sm leading-relaxed text-brand-dark">
        <b>
          {info.emoji} {info.startLabel}
        </b>
        {isCreator
          ? " — one goal for one piece of work, on top of the monthly support on your page."
          : ` — ${info.startHint.toLowerCase()}.`}
        <span className="mt-1.5 block text-xs text-brand-dark/70">
          Raising something different this time?{" "}
          {ACCOUNT_KINDS.filter((k) => k.key !== kind).map((k, i) => (
            <span key={k.key}>
              {i > 0 ? " · " : ""}
              <Link href={`/start?kind=${k.key}`} className="font-bold underline">
                {k.startLabel}
              </Link>
            </span>
          ))}
        </span>
      </p>

      <Section title="1. Basics · মূল তথ্য">
        <label className="block text-sm font-medium" htmlFor="title">
          {isCreator ? "Project title (English)" : "Campaign title (English)"}{" "}
          <Req />
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
              ? "e.g. A camera to film the flood districts"
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

        {isCreator ? (
          <p className="mt-4 rounded-xl border border-foreground/10 bg-background p-4 text-sm leading-relaxed text-body">
            This project is raised by{" "}
            <b>{profileName || "you"}</b>, on your own page — so we
            don&rsquo;t ask you again who the money is for or how you know
            them.
          </p>
        ) : null}

        <div
          className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${isCreator ? "hidden" : ""}`}
        >
          <div>
            <label className="block text-sm font-medium" htmlFor="beneficiary_name">
              {isOccasion
                ? "Who / which charity you're raising for"
                : "Beneficiary name"}{" "}
              {isCreator ? null : <Req />}
            </label>
            <input
              id="beneficiary_name"
              name="beneficiary_name"
              required={!isCreator}
              value={values.beneficiary_name}
              onChange={set("beneficiary_name")}
              placeholder={
                isOccasion ? "e.g. JAAGO Foundation" : "Md. Rahim Uddin"
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="district">
              District · জেলা {isCreator ? null : <Req />}
            </label>
            <input
              id="district"
              name="district"
              required={!isCreator}
              value={values.district}
              onChange={set("district")}
              placeholder="Jashore"
              className={inputClass}
            />
          </div>
        </div>

        <div
          className={`mt-4 rounded-xl border border-foreground/10 bg-background p-4 ${isCreator ? "hidden" : ""}`}
        >
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
                Organizer name (you) {isCreator ? null : <Req />}
              </label>
              <input
                id="organizer_name"
                name="organizer_name"
                required={!isCreator}
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
                Relationship to beneficiary {isCreator ? null : <Req />}
              </label>
              <select
                id="organizer_relationship"
                name="organizer_relationship"
                required={!isCreator}
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
          placeholder={
            isCreator
              ? "বন্যা অঞ্চলে শুটিংয়ের জন্য একটি ক্যামেরা"
              : isOccasion
                ? "আমার জন্মদিনে অন্যের জন্য তহবিল"
                : "রহিমের হার্ট সার্জারিতে সাহায্য করুন"
          }
        />
      </Section>

      <Section title="3. Story · বিবরণ">
        <label className="block text-sm font-medium" htmlFor="summary">
          {isCreator
            ? "What is this project, in a line or two? (English)"
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
          {isCreator
            ? "The whole plan — what it costs and what it changes (English)"
            : "Full story (English)"}{" "}
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

      {isCreator ? null : (
        <Section
          title="3b. Social media links · সোশ্যাল লিংক (optional)"
          subtitle="Shown publicly on your campaign so donors can find you and trust who you are."
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
      )}

      <Section
        title={
          isCreator
            ? "4. Project goal & time · লক্ষ্য ও সময়"
            : "4. Funding goal & duration · লক্ষ্য ও সময়"
        }
        subtitle={
          isCreator
            ? "Monthly support keeps coming in through the tiers on your page — this is the one-off goal for this project, and it finishes when the time is up."
            : undefined
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="goal_amount">
              {isCreator ? "Project goal (৳ Taka)" : "Goal amount (৳ Taka)"}{" "}
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
              placeholder={isCreator ? "50000" : "350000"}
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
      </Section>

      <Section
        title="4b. Photos & video · ছবি ও ভিডিও"
        subtitle={
          isCreator
            ? "Show the work. At least one photo is required — add up to 12, plus a video (upload or a YouTube link). Shown publicly as a swipeable gallery."
            : "At least one photo is required. Add up to 6 photos and one video (upload or a YouTube link). Shown publicly as a swipeable gallery."
        }
      >
        <MediaUploader userId={userId} maxPhotos={isCreator ? 12 : 6} />
      </Section>

      {reusing && known ? (
        <Section
          title="5. Verification & payout · যাচাই (private & confidential)"
          subtitle="You have already been verified once. Our team re-checks these details for every campaign, but you do not have to type them again."
        >
          <div className="rounded-xl border border-foreground/10 bg-background p-4">
            <p className="text-sm font-semibold">
              Using the details already on file
            </p>
            <ul className="mt-2 space-y-1 text-sm text-body">
              <li>👤 {known.name}</li>
              <li>
                🪪 ID ending <b>{known.nidTail || "—"}</b>
                {known.hasIdDocument ? " · document already uploaded" : null}
              </li>
              {known.phoneTail ? (
                <li>
                  📱 Phone ending <b>{known.phoneTail}</b>
                </li>
              ) : null}
              {known.payout ? <li>৳ {known.payout}</li> : null}
            </ul>
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="notes"
            >
              {isCreator
                ? "What will this project pay for? (optional)"
                : "Anything else for the reviewer (optional)"}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={values.notes}
              onChange={set("notes")}
              className={inputClass}
            />
            <p className="mt-4 text-sm">
              <Link
                href={`/start?kind=${kind}&again=1`}
                className="font-bold text-brand underline"
              >
                Use different ID or payout details for this {thing}
              </Link>
            </p>
          </div>
        </Section>
      ) : (
        <>
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
                  placeholder="e.g. a camera, travel to reach the families, editing each month…"
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
        </>
      )}

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
        Fields marked <Req /> are required. Your {thing} is reviewed before it
        goes live — you&rsquo;ll see it on your dashboard once submitted.
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
        className="press mt-5 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand px-6 py-4 text-lg font-bold text-white shadow-brand hover:bg-brand-dark disabled:bg-foreground/20 disabled:text-foreground/50 disabled:shadow-none"
      >
        {pending ? "Submitting…" : "Submit for review · পর্যালোচনার জন্য জমা দিন"}
      </button>
    </form>
  );
}
