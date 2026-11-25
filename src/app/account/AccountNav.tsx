"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* The creator dashboard's own navigation.

   A sidebar on a laptop, a scrolling row of pills on a phone — the
   same set either way. Patreon keeps this rail visible on every screen
   of the dashboard, and that persistence is most of what makes it feel
   like a tool rather than a settings page. */

const ITEMS = [
  { href: "/account", label: "Dashboard", icon: "▦" },
  { href: "/account/posts", label: "Posts", icon: "✎" },
  { href: "/account/supporters", label: "Supporters", icon: "♡" },
  { href: "/account/insights", label: "Insights", icon: "📈" },
  { href: "/account/payouts", label: "Payouts", icon: "৳" },
  { href: "/account/my-page", label: "My page", icon: "◍" },
] as const;

export function AccountNav({ username }: { username: string | null }) {
  const pathname = usePathname();

  const isOn = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <>
      {/* Phone: a scrolling row under the header */}
      <nav
        aria-label="Dashboard"
        className="scroll-x -mx-5 flex gap-2 px-5 pb-1 lg:hidden"
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isOn(item.href) ? "page" : undefined}
            className={`press inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold no-underline ${
              isOn(item.href)
                ? "bg-brand text-white"
                : "border border-foreground/15 bg-card text-body"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Laptop: a sidebar that stays put */}
      <nav
        aria-label="Dashboard"
        className="hidden w-56 shrink-0 lg:block"
      >
        <div className="sticky top-24 space-y-1">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isOn(item.href) ? "page" : undefined}
              className={`press flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold no-underline ${
                isOn(item.href)
                  ? "bg-brand-tint text-brand-dark"
                  : "text-body hover:bg-foreground/5"
              }`}
            >
              <span aria-hidden="true" className="w-4 text-center">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          {username ? (
            <Link
              href={`/creator/${username}`}
              className="press mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-brand no-underline hover:bg-brand-tint"
            >
              View public page ↗
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
