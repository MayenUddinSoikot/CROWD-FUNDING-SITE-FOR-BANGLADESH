"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSetup, checkUsername } from "./actions";
import { FOCUS_OPTIONS } from "@/lib/creator-focus";
import { Button, inputClass } from "@/components/ui";
import { SOCIAL_PLATFORMS } from "@/lib/types";

/* Three steps, in Patreon's order: your address, what you raise for,
   where people already follow you.

   It is one form the whole way through — the steps only decide what is
   on screen — so moving back and forth never loses what was typed, and
   the final submit carries everything at once. */

const STEPS = ["Your page address", "What you raise for", "Your links"];

export function SetupWizard({
  initialName,
  siteUrl,
}: {
  initialName: string;
  siteUrl: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveSetup, undefined);

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(initialName);
  const [focus, setFocus] = useState<string[]>([]);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [check, setCheck] = useState<{ ok: boolean; message: string }>({
    ok: false,
    message: "",
  });

  // Check availability as they type, a beat after they stop. The empty
  // case is handled by the timer too rather than by setting state
  // straight from the effect body.
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const result = username
        ? await checkUsername(username)
        : { ok: false, message: "" };
      if (!cancelled) setCheck(result);
    }, username ? 400 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [username]);

  useEffect(() => {
    if (state?.done) router.push("/account");
  }, [state, router]);

  const base = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const canContinue =
    step === 0 ? check.ok && displayName.trim().length >= 2 : true;

  return (
    <form action={action}>
      {/* Everything stays in the form across steps, so nothing is lost
          going back and the final submit carries the lot. */}
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="display_name" value={displayName} />
      {focus.map((f) => (
        <input key={f} type="hidden" name="focus" value={f} />
      ))}
      {SOCIAL_PLATFORMS.map((p) => (
        <input
          key={p.key}
          type="hidden"
          name={`social_${p.key}`}
          value={socials[p.key] ?? ""}
        />
      ))}

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={`h-1.5 rounded-full ${
                i <= step ? "bg-brand" : "bg-track"
              }`}
            />
            <span
              className={`text-[11px] font-bold ${
                i <= step ? "text-brand" : "text-muted"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {step === 0 ? (
          <>
            <h2 className="text-2xl font-extrabold">Create your page</h2>
            <p className="mt-1 text-sm text-muted">
              You can change all of this later.
            </p>

            <label
              className="mt-6 block text-sm font-semibold"
              htmlFor="display_name_input"
            >
              What should your page be called?
            </label>
            <input
              id="display_name_input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name, or your organisation"
              className={inputClass}
            />

            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="username_input"
            >
              Choose your address
            </label>
            <div
              className={`field-ring mt-1 flex items-center rounded-xl border bg-card px-4 ${
                username && !check.ok
                  ? "border-accent/50"
                  : "border-foreground/15"
              }`}
            >
              <span className="shrink-0 text-sm text-muted">
                {base}/creator/
              </span>
              <input
                id="username_input"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                  )
                }
                placeholder="your-name"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
              />
              {username && check.ok ? (
                <span className="shrink-0 text-brand" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </div>
            {check.message ? (
              <p
                className={`mt-1.5 text-xs font-semibold ${
                  check.ok ? "text-brand" : "text-accent-ink"
                }`}
              >
                {check.message}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted">
                This is the link you&rsquo;ll share everywhere, so keep it
                short.
              </p>
            )}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 className="text-2xl font-extrabold">What do you raise for?</h2>
            <p className="mt-1 text-sm text-muted">
              Pick everything that applies. It helps donors find you.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((option) => {
                const on = focus.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFocus((cur) =>
                        on ? cur.filter((f) => f !== option) : [...cur, option]
                      )
                    }
                    className={`press min-h-[44px] rounded-full border-2 px-5 text-sm font-bold ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-foreground/10 bg-card hover:border-brand"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-2xl font-extrabold">
              Where can people already find you?
            </h2>
            <p className="mt-1 text-sm text-muted">
              These appear as buttons on your page. Most people give to someone
              whose work they already know — skip it if you&rsquo;d rather.
            </p>

            <div className="mt-6 space-y-3">
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key}>
                  <label
                    className="block text-sm font-semibold"
                    htmlFor={`setup_${p.key}`}
                  >
                    {p.emoji} {p.label}
                  </label>
                  <input
                    id={`setup_${p.key}`}
                    type="url"
                    value={socials[p.key] ?? ""}
                    onChange={(e) =>
                      setSocials((cur) => ({ ...cur, [p.key]: e.target.value }))
                    }
                    placeholder={p.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {state?.error ? (
        <p
          className="mt-5 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-ink"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="press min-h-[48px] rounded-full border border-foreground/15 px-5 text-sm font-bold hover:border-brand"
          >
            Back
          </button>
        ) : null}

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
            className="flex-1"
          >
            Continue
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={pending} className="flex-1">
            {pending ? "Creating your page…" : "Create my page"}
          </Button>
        )}
      </div>

      {step === STEPS.length - 1 ? (
        <button
          type="submit"
          disabled={pending}
          className="press mt-3 w-full text-center text-sm font-bold text-muted hover:text-brand"
        >
          Skip for now
        </button>
      ) : null}
    </form>
  );
}
