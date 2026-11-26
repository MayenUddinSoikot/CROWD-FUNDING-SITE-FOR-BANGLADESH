import Link from "next/link";
import { SocialIcon } from "@/components/SocialIcon";

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
      heading: "Fees",
      links: [
        { label: "0% platform fee", href: "/about#fee" },
        { label: "How the money moves", href: "/about#fee" },
        { label: "Payouts to bKash & bank", href: "/about#how" },
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "How Shohay works", href: "/about#how" },
        { label: "Verified & safe", href: "/about#safety" },
        { label: "Help & FAQ", href: "/faq" },
      ],
    },
    {
      heading: "Shohay",
      links: [
        { label: "About us", href: "/about" },
        { label: "News & stories", href: "/news" },
        { label: "Terms of use", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
      ],
    },
  ];

const SOCIALS: { label: string; key: string; href: string }[] = [
  { label: "Facebook", key: "facebook", href: "#" },
  { label: "Instagram", key: "instagram", href: "#" },
  { label: "YouTube", key: "youtube", href: "#" },
  { label: "TikTok", key: "tiktok", href: "#" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#0f1211] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-16 sm:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold text-white">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label + link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 no-underline hover:text-white"
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
        <div className="mt-14 flex flex-col gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-bengali text-2xl font-bold text-white">
              সহায়
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Shohay
            </span>
          </Link>
          <div>
            <p className="mb-2.5 text-sm font-semibold text-white/70 sm:text-right">
              Follow us on social media
            </p>
            <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-base text-white no-underline hover:border-white hover:bg-white/10"
              >
                <SocialIcon platform={s.key} size={18} />
              </a>
            ))}
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-8 flex flex-col gap-3 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Shohay · 0% platform fee · Made in Bangladesh 🇧🇩
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="no-underline hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="no-underline hover:text-white">
              Privacy
            </Link>
            <Link href="/faq" className="no-underline hover:text-white">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
