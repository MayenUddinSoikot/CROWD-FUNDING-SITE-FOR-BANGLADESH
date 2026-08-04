import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { formatTaka } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/types";
import type {
  Campaign,
  CampaignVerification,
  CampaignDocument,
} from "@/lib/types";
import { DOC_TYPE_LABELS } from "@/lib/types";
import {
  approveCampaign,
  rejectCampaign,
  freezeCampaign,
  unfreezeCampaign,
} from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review campaign — Shohay সহায়" };

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-foreground/10 py-2 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm opacity-60">{label}</span>
      <span className="text-sm font-medium sm:text-right">
        {value && value.trim() ? value : "—"}
      </span>
    </div>
  );
}

export default async function AdminCampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { id } = await params;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, slug, title, title_bn, summary, summary_bn, story, story_bn, category, goal_amount, raised_amount, status, cover_image_url, beneficiary_name, district, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();
  const c = campaign as Campaign;

  const { data: verificationRow } = await supabase
    .from("campaign_verifications")
    .select("*")
    .eq("campaign_id", id)
    .maybeSingle();
  const v = verificationRow as CampaignVerification | null;

  const { data: documentRows } = await supabase
    .from("campaign_documents")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });
  const documents = (documentRows ?? []) as CampaignDocument[];

  // Time-limited private links (valid ~10 min) — only generated for admins.
  const docLinks = await Promise.all(
    documents.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("campaign-docs")
        .createSignedUrl(doc.storage_path, 600);
      return { doc, url: signed?.signedUrl ?? null };
    })
  );

  const category = CATEGORY_LABELS[c.category] ?? CATEGORY_LABELS.other;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <p className="mt-8 text-sm">
          <Link href="/admin" className="opacity-60 hover:text-brand">
            ← Dashboard
          </Link>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold capitalize">
            {c.status}
          </span>
          <span className="text-xs uppercase tracking-wide text-brand">
            {category.en} · <span className="font-bengali">{category.bn}</span>
          </span>
        </div>

        <h1 className="mt-2 font-serif text-2xl font-bold">{c.title}</h1>
        {c.title_bn ? (
          <p className="font-bengali text-lg opacity-80">{c.title_bn}</p>
        ) : null}

        {/* Approve / reject */}
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={approveCampaign}>
            <input type="hidden" name="id" value={c.id} />
            <button
              type="submit"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Approve · অনুমোদন
            </button>
          </form>
          <form action={rejectCampaign}>
            <input type="hidden" name="id" value={c.id} />
            <button
              type="submit"
              className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
            >
              Reject · বাতিল
            </button>
          </form>
          {c.status === "frozen" ? (
            <form action={unfreezeCampaign}>
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                className="rounded-full border border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-500/10"
              >
                🧊 Unfreeze · আনফ্রিজ
              </button>
            </form>
          ) : (
            <form action={freezeCampaign}>
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                className="rounded-full border border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-500/10"
              >
                🧊 Freeze funds
              </button>
            </form>
          )}
          <Link
            href={`/admin/${c.id}/report`}
            className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            📄 Donation report (PDF)
          </Link>
          {c.status === "approved" ? (
            <Link
              href={`/campaigns/${c.slug}`}
              className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              View public page →
            </Link>
          ) : null}
        </div>

        {/* Campaign details */}
        <section className="mt-8 rounded-2xl border border-foreground/10 bg-card p-6">
          <h2 className="text-sm font-bold text-brand">Campaign</h2>
          <div className="mt-2">
            <Row label="Beneficiary" value={c.beneficiary_name} />
            <Row label="District" value={c.district} />
            <Row label="Goal" value={formatTaka(c.goal_amount)} />
            <Row label="Raised" value={formatTaka(c.raised_amount)} />
            <Row label="Summary" value={c.summary} />
          </div>
          {c.story ? (
            <div className="mt-4">
              <p className="text-sm opacity-60">Story</p>
              <p className="mt-1 whitespace-pre-line text-sm">{c.story}</p>
            </div>
          ) : null}
        </section>

        {/* Private verification */}
        <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-sm font-bold text-amber-700">
            🔒 Private — applicant & verification
          </h2>
          {v ? (
            <div className="mt-2">
              <Row label="Applicant name" value={v.applicant_name} />
              <Row label="NID / Passport / Birth certificate no." value={v.applicant_nid} />
              <Row label="Phone" value={v.applicant_phone} />
              <Row label="Email" value={v.applicant_email} />
              <Row label="Relationship to beneficiary" value={v.relationship} />
            </div>
          ) : (
            <p className="mt-2 text-sm opacity-60">
              No verification details were submitted with this campaign.
            </p>
          )}
        </section>

        {/* Private payout */}
        {v ? (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <h2 className="text-sm font-bold text-amber-700">
              🔒 Private — payout details
            </h2>
            <div className="mt-2">
              <Row label="bKash / Nagad" value={v.bkash_number} />
              <Row label="Bank" value={v.bank_name} />
              <Row label="Account holder" value={v.bank_account_name} />
              <Row label="Account number" value={v.bank_account_number} />
              <Row label="Branch" value={v.bank_branch} />
              <Row label="Notes" value={v.notes} />
            </div>
          </section>
        ) : null}

        {/* Private documents */}
        <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-sm font-bold text-amber-700">
            🔒 Private — documents
          </h2>
          {docLinks.length === 0 ? (
            <p className="mt-2 text-sm opacity-60">
              No documents were uploaded with this campaign.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {docLinks.map(({ doc, url }) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    <span className="opacity-60">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? "Document"}:{" "}
                    </span>
                    {doc.file_name ?? "file"}
                  </span>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-semibold text-brand hover:underline"
                    >
                      Open →
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs opacity-50">
                      unavailable
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
