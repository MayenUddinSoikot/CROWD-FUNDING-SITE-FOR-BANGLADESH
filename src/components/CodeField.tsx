"use client";

/* The 6-digit one-time code box.

   autoComplete="one-time-code" is the important bit: iOS and Android
   offer the code straight from the notification, so most people never
   type it at all. inputMode="numeric" brings up the number pad. */

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
      maxLength={6}
      aria-label="6-digit code"
      placeholder="------"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="field-ring mt-1 w-full rounded-2xl border-2 border-foreground/15 bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none"
    />
  );
}
