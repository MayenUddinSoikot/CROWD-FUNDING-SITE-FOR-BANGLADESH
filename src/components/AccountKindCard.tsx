import { ACCOUNT_KINDS, accountKind } from "@/lib/account-kind";
import { chooseAccountKind } from "@/app/start/actions";
import { Card } from "@/components/ui";

/* Changing what the account raises as, from My page.

   Three radio buttons and one Save, rather than a settings screen of
   its own — this is one decision and it is reversible. */

export function AccountKindCard({
  current,
  saved,
}: {
  current: string | null;
  saved?: boolean;
}) {
  const now = accountKind(current);

  return (
    <Card className="mt-6 p-5">
      <p className="text-sm font-semibold">What you raise as</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        This decides what the form asks you for and what your campaigns are
        called. Right now:{" "}
        <b className="text-foreground">
          {now.emoji} {now.title}
        </b>
        {current ? "" : " (nothing chosen yet)"}.
      </p>

      <form action={chooseAccountKind} className="mt-4">
        <input type="hidden" name="next" value="my-page" />
        <div className="space-y-2">
          {ACCOUNT_KINDS.map((option) => (
            <label
              key={option.key}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                current === option.key
                  ? "border-brand bg-brand-tint/50"
                  : "border-foreground/10 bg-background"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.key}
                defaultChecked={current === option.key}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]"
              />
              <span>
                <span className="block text-sm font-bold">
                  {option.emoji} {option.title}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                  {option.desc}
                </span>
              </span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="press mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Save
        </button>
        {saved ? (
          <span className="ml-3 text-sm font-semibold text-brand">Saved ✓</span>
        ) : null}
      </form>
    </Card>
  );
}
