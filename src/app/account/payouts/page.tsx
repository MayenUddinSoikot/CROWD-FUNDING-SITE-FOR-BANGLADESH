import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatTaka } from "@/lib/format";
import { Card, EmptyState, ButtonLink } from "@/components/ui";
import type { DashboardCampaign } from "@/components/CampaignRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payouts — Shohay সহায়" };

const BANK_FEE = 0.03;
const DAY = 24 * 60 * 60 * 1000;
/* Money is released three days after a campaign ends, which is the
   window for a chargeback or a complaint to surface. */
const HOLD_DAYS = 3;

export default async function PayoutsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("my_campaign_dashboard");
  const campaigns = (data ?? []) as DashboardCampaign[];
  const earning = campaigns.filter((c) => Number(c.raised_amount) > 0);

  const total = earning.reduce(
    (sum, c) => sum + (Number(c.raised_amount) || 0),
    0
  );
  const afterFee = Math.round(total * (1 - BANK_FEE));

  function payoutDate(c: DashboardCampaign): string {
    if (c.is_recurring || !c.ends_at) return "When the campaign ends";
    const when = new Date(c.ends_at).getTime() + HOLD_DAYS * DAY;
    if (Number.isNaN(when)) return "When the campaign ends";
    return new Date(when).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Payouts</h1>
      <p className="mt-1 text-sm text-muted">
        What you&rsquo;ve raised, what reaches your account, and when.
      </p>

      <p className="mt-5 rounded-xl bg-warn-tint px-4 py-3 text-sm leading-relaxed text-warn-ink">
        <b>No money has moved yet.</b> Card and bKash payments are still being
        connected, so everything below is recorded but not yet collected. The
        figures and the dates are real; the transfer isn&rsquo;t.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-2xl font-extrabold text-brand">
            {formatTaka(total)}
          </p>
          <p className="mt-1 text-sm text-body">Raised</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-extrabold">{formatTaka(afterFee)}</p>
          <p className="mt-1 text-sm text-body">Reaches your account</p>
          <p className="mt-1 text-xs text-muted">
            After the bank&rsquo;s ~3% to move the money
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-extrabold">{formatTaka(0)}</p>
          <p className="mt-1 text-sm text-body">Paid out so far</p>
          <p className="mt-1 text-xs text-muted">Nothing collected yet</p>
        </Card>
      </div>

      <h2 className="mt-10 text-xl font-bold">By campaign</h2>

      {earning.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing raised yet"
            hint="Amounts appear here as donations come in."
            action={<ButtonLink href="/start">Start a campaign</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {earning.map((c) => {
            const raised = Number(c.raised_amount) || 0;
            return (
              <li key={c.campaign_id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{c.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      Released {payoutDate(c)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-extrabold text-brand">
                      {formatTaka(Math.round(raised * (1 - BANK_FEE)))}
                    </span>
                    <span className="block text-xs text-muted">
                      of {formatTaka(raised)} raised
                    </span>
                  </span>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="mt-8 p-5">
        <p className="font-bold">How payouts work</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-body">
          <li>
            Money is released <b>three days after your campaign ends</b>. That
            window is there so a disputed payment or a complaint can surface
            before the funds leave.
          </li>
          <li>
            Shohay takes <b>0%</b>. The only deduction is the bank&rsquo;s
            charge for moving the money, around 3%.
          </li>
          <li>
            Tips donors leave for Shohay are separate and never come out of
            your total.
          </li>
          <li>
            Payment goes to the bKash, Nagad or bank account you gave when you
            created the campaign.
          </li>
        </ul>
      </Card>
    </>
  );
}
