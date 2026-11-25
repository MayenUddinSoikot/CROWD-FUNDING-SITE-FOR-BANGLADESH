"use client";

/* The one-time code box.

   Deliberately not fixed at 6 characters. Supabase's Email OTP Length
   is a project setting that can be anything from 6 to 10, and a box
   that silently truncates an 8-digit code leaves someone unable to log
   in with no idea why. Accept up to 10 and let the server judge.

   autoComplete="one-time-code" is the important bit: iOS and Android
   offer the code straight from the notification, so most people never
   type it at all. inputMode="numeric" brings up the number pad. */

export const CODE_MIN = 6;
export const CODE_MAX = 10;

export function CodeField({
  value,
  onChange,
  id = "token",
  name = "token",
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  name?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      type="text"
      required
      autoFocus
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={CODE_MAX}
      aria-label="Login code"
      placeholder="------"
      value={value}
      onChange={(e) =>
        onChange(e.target.value.replace(/\D/g, "").slice(0, CODE_MAX))
      }
      className="field-ring mt-1 w-full rounded-2xl border-2 border-foreground/15 bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] outline-none"
    />
  );
}
