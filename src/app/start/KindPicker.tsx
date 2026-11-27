import Link from "next/link";
import { ACCOUNT_KINDS } from "@/lib/account-kind";
import { chooseAccountKind } from "./actions";

/* Asked once, on the way to the first campaign.

   Before this, a creator and a family raising for an operation were
   handed the same form — so a creator was asked for a "beneficiary
   name" and their "relationship to the beneficiary", which are not
   questions about them at all. */

export function KindPicker({ current }: { current?: string | null }) {
  return (
    <form action={chooseAccountKind} className="mt-8 w-full max-w-2xl text-left">
      <p className="text-center text-base leading-relaxed text-body">
        Pick the one that fits. It decides what we ask you for — and we
        only ask once.
      </p>
      <p className="font-bengali mt-1 text-center text-sm text-muted">
        একবারই বেছে নিন — পরে বদলানো যাবে
      </p>

      <div className="mt-7 grid grid-cols-1 gap-4">
        {ACCOUNT_KINDS.map((option) => (
          <button
            key={option.key}
            type="submit"
            name="kind"
            value={option.key}
            className={`press rounded-2xl border-2 bg-card p-6 text-left shadow-soft hover:border-brand ${
              current === option.key ? "border-brand" : "border-foreground/10"
            }`}
          >
            <p className="text-3xl" aria-hidden="true">
              {option.emoji}
            </p>
            <p className="mt-2 text-lg font-bold">
              {option.title}{" "}
              <span className="font-bengali text-base font-medium text-muted">
                · {option.bn}
              </span>
            </p>
            <p className="mt-1.5 leading-relaxed text-body">{option.desc}</p>
            <p className="mt-3 text-sm font-bold text-brand">
              {option.startLabel} →
            </p>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        You can change this later on{" "}
        <Link href="/account/my-page" className="font-bold text-brand">
          My page
        </Link>
        .
      </p>
    </form>
  );
}
