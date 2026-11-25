import Link from "next/link";
import { Card } from "@/components/ui";

/* "3 of 5 complete".

   Patreon puts this at the top of a new creator's dashboard and it is
   the single most effective thing on the page: a half-finished creator
   page raises nothing, and most people stop after picking a username
   unless something keeps asking for the next step.

   It disappears entirely once all five are done, rather than sitting
   there as a permanent tick-list nobody reads. */

export type ChecklistStep = {
  key: string;
  title: string;
  hint: string;
  href: string;
  done: boolean;
};

export function SetupChecklist({ steps }: { steps: ChecklistStep[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const next = steps.find((s) => !s.done);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-foreground/[0.07] p-6">
        <p className="text-lg font-extrabold">Finish setting up your page</p>
        <p className="mt-1 text-sm text-body">
          A half-finished page raises very little. These are the five things
          that matter.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-bold text-brand">
            {done} of {steps.length}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-foreground/[0.07]">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className="flex items-center gap-4 px-6 py-4 no-underline hover:bg-foreground/[0.03]"
            >
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.done
                    ? "bg-brand text-white"
                    : "border-2 border-foreground/15 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-bold ${
                    step.done ? "text-muted line-through" : ""
                  }`}
                >
                  {step.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {step.hint}
                </span>
              </span>
              {step.key === next?.key ? (
                <span className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white">
                  Do this
                </span>
              ) : (
                <span className="shrink-0 text-xl opacity-30">›</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
