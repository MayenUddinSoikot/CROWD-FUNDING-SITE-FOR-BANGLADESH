import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Creators",
      links: [
        { label: "Browse creators", href: "/creators" },
        { label: "☕ Support a creator", href: "/creators" },
        { label: "🏆 Top creators", href: "/leaderboard" },
        { label: "Become a creator", href: "/setup" },
      ],
    },
    {
      heading: "Fundraising",
      links: [
        { label: "Browse campaigns", href: "/campaigns" },
        { label: "Start a campaign", href: "/start" },
        { label: "🎂 Occasion fundraisers", href: "/campaigns?filter=birthday" },
        { label: "Medical", href: "/campaigns?category=medical" },
        { label: "Education", href: "/campaigns?category=education" },
        { label: "Disaster relief", href: "/campaigns?category=disaster_relief" },
      ],
    },
    {
      heading: "About Shohay",
      links: [
        { label: "How Shohay works", href: "/about#how" },
        { label: "0% platform fee", href: "/about#fee" },
        { label: "Verified & safe", href: "/about#safety" },
        { label: "News & stories", href: "/news" },
        { label: "Help & FAQ", href: "/faq" },
      ],
    },
  ];

const SOCIALS: { label: string; symbol: string; href: string }[] = [
  { label: "Facebook", symbol: "f", href: "#" },
  { label: "YouTube", symbol: "▶", href: "#" },
  { label: "X", symbol: "𝕏", href: "#" },
  { label: "Instagram", symbol: "◎", href: "#" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-foreground/10 bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label + link.href}>
                    <Link
                      href={link.href}
                      className="text-sm opacity-70 hover:text-brand hover:opacity-100"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social + brand */}
        <div className="mt-10 flex flex-col gap-6 border-t border-foreground/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-bengali text-2xl font-bold text-brand">
              সহায়
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
              Shohay
            </span>
          </Link>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-sm hover:border-brand hover:text-brand"
              >
                {s.symbol}
              </a>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-8 flex flex-col gap-3 text-sm opacity-60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Shohay · 0% platform fee · Made in Bangladesh 🇧🇩
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-brand">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-brand">
              Privacy
            </Link>
            <Link href="/faq" className="hover:text-brand">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
