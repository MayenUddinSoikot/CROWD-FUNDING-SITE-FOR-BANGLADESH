import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ============================================================
   The shared kit. Every page builds from these, so a button on
   the admin panel behaves exactly like one on a campaign page.
   ============================================================ */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "press inline-flex items-center justify-center gap-2 rounded-full font-bold text-center " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-brand hover:bg-brand-dark disabled:bg-foreground/20 disabled:text-foreground/50",
  secondary:
    "bg-card text-foreground border border-foreground/15 hover:border-brand hover:text-brand",
  ghost: "bg-transparent text-brand hover:bg-brand-tint",
  danger: "bg-accent text-white hover:brightness-95",
};

// Every size clears 44px so a thumb hits it first time.
const SIZE: Record<Size, string> = {
  sm: "min-h-[44px] px-4 py-2 text-sm",
  md: "min-h-[44px] px-6 py-3 text-base",
  lg: "min-h-[52px] px-7 py-3.5 text-lg",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  full = false
): string {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${full ? "w-full" : ""}`;
}

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
} & ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`${buttonClass(variant, size, full)} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
} & ComponentProps<typeof Link>) {
  return (
    <Link
      {...rest}
      className={`${buttonClass(variant, size, full)} no-underline ${className}`}
    />
  );
}

export function Card({
  className = "",
  hover = false,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl bg-card shadow-soft ${hover ? "lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  bn,
  children,
}: {
  title: string;
  bn?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {bn ? (
          <p className="font-bengali mt-1 text-base text-muted sm:text-lg">{bn}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ProgressBar({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-track ${className}`}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Funding progress"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  live: "bg-brand-tint text-brand-dark",
  approved: "bg-brand-tint text-brand-dark",
  pending: "bg-warn-tint text-warn-ink",
  draft: "bg-foreground/10 text-body",
  rejected: "bg-accent-tint text-accent-ink",
  completed: "bg-foreground/10 text-body",
  frozen: "bg-info-tint text-info-ink",
  urgent: "bg-accent-tint text-accent-ink",
};

export function StatusBadge({
  tone,
  children,
  className = "",
}: {
  tone: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        STATUS_TONE[tone] ?? STATUS_TONE.draft
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  bn,
  hint,
  action,
}: {
  title: string;
  bn?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-8 text-center sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          className="text-brand-dark"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </div>
      <p className="mt-4 text-lg font-bold">{title}</p>
      {bn ? <p className="font-bengali mt-1 text-muted">{bn}</p> : null}
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export const inputClass =
  "field-ring mt-1 w-full rounded-xl border border-foreground/15 bg-card px-4 py-3 text-base outline-none";
