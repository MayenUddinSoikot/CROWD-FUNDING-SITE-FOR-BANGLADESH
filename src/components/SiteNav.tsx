"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

type MenuItem = { title: string; subtitle: string; href: string };

const MENUS: Record<string, { heading: string; items: MenuItem[] }> = {
  creators: {
    heading: "Find someone worth backing",
    items: [
      { title: "Browse creators", subtitle: "People raising all year round", href: "/creators" },
      { title: "☕ Support a creator", subtitle: "Monthly, from ৳100", href: "/creators" },
      { title: "🏆 Top creators", subtitle: "Who raised the most", href: "/leaderboard" },
      { title: "Become a creator", subtitle: "Build your own page", href: "/setup" },
    ],
  },
  fundraising: {
    heading: "Campaigns, and how to start one",
    items: [
      { title: "Browse campaigns", subtitle: "Every live campaign", href: "/campaigns" },
      { title: "Start a campaign", subtitle: "Medical, education, a cause", href: "/start" },
      { title: "🎂 Occasion fundraisers", subtitle: "Raise on your birthday", href: "/campaigns?filter=birthday" },
      { title: "Medical", subtitle: "Help with medical costs", href: "/campaigns?category=medical" },
      { title: "Education", subtitle: "Support students", href: "/campaigns?category=education" },
      { title: "Disaster relief", subtitle: "Give to verified relief", href: "/campaigns?category=disaster_relief" },
    ],
  },
};

function Dropdown({
  id,
  label,
  menu,
  setMenu,
}: {
  id: string;
  label: string;
  menu: string | null;
  setMenu: (v: string | null) => void;
}) {
  const active = menu === id;
  const data = MENUS[id];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenu(active ? null : id)}
        className={`flex items-center gap-1 hover:text-brand ${active ? "text-brand" : ""}`}
      >
        {label} <span className="text-xs">{active ? "▲" : "▼"}</span>
      </button>
      {active ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-[440px] rounded-2xl border border-foreground/10 bg-background p-5 shadow-xl">
          <p className="mb-3 text-sm font-semibold opacity-60">{data.heading}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {data.items.map((item) => (
              <Link
                key={item.title + item.href}
                href={item.href}
                onClick={() => setMenu(null)}
                className="group block"
              >
                <span className="block font-semibold group-hover:text-brand">
                  {item.title}
                </span>
                <span className="block text-sm opacity-60">{item.subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SiteNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const close = () => setOpen(false);

  return (
    <>
      {/* Backdrop to close dropdowns */}
      {menu ? (
        <div
          className="fixed inset-0 z-40 hidden lg:block"
          onClick={() => setMenu(null)}
        />
      ) : null}

      {/* Desktop nav */}
      <nav className="hidden items-center gap-5 text-sm lg:flex">
        <Dropdown id="creators" label="Creators" menu={menu} setMenu={setMenu} />
        <Dropdown
          id="fundraising"
          label="Fundraising"
          menu={menu}
          setMenu={setMenu}
        />
        <Link href="/about#fee" className="hover:text-brand">
          Fees
        </Link>
        <Link href="/faq" className="hover:text-brand">
          Help
        </Link>
        {isLoggedIn ? (
          <Link href="/account" className="hover:text-brand">
            My campaigns
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin" className="font-semibold hover:text-brand">
            Admin
          </Link>
        ) : null}
        {isLoggedIn ? (
          <form action={logout}>
            <button type="submit" className="hover:text-brand">
              Log out
            </button>
          </form>
        ) : (
          <>
            <Link href="/login" className="hover:text-brand">
              Log in
            </Link>
            <Link href="/signup" className="font-semibold hover:text-brand">
              Sign up
            </Link>
          </>
        )}
        <Link
          href="/start"
          className="rounded-full bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
        >
          Start a campaign
        </Link>
      </nav>

      {/* Mobile / tablet: search + hamburger */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/search" aria-label="Search" className="bar-icon text-lg">
          🔍
        </Link>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="bar-icon flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/20 text-lg"
        >
          ☰
        </button>
      </div>

      {/* Right-side drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          {/* Opens from the left and fills the screen, as Patreon's does.
              Fixed dark colours rather than theme tokens: the panel should
              look the same whichever theme the phone is in. */}
          <div className="absolute left-0 top-0 flex h-full w-full flex-col bg-[#0f1211] px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <span className="font-bengali text-2xl font-bold">সহায়</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="press flex h-11 w-11 items-center justify-center text-3xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              <AccordionSection
                sectionKey="creators"
                label="Creators"
                subtitle="Find someone worth backing"
                open={section === "creators"}
                onToggle={() =>
                  setSection(section === "creators" ? null : "creators")
                }
                onNavigate={close}
              />
              <AccordionSection
                sectionKey="fundraising"
                label="Fundraising"
                subtitle="Campaigns, and how to start one"
                open={section === "fundraising"}
                onToggle={() =>
                  setSection(section === "fundraising" ? null : "fundraising")
                }
                onNavigate={close}
              />
              <DrawerItem
                href="/about#fee"
                title="Fees"
                subtitle="0% on donations · 15% on a creator page"
                onClick={close}
              />
              <DrawerItem
                href="/faq"
                title="Help"
                subtitle="Support in Bangla & English"
                onClick={close}
              />
              {isLoggedIn ? (
                <DrawerItem
                  href="/account"
                  title="Your dashboard"
                  subtitle="Campaigns, supporters and payouts"
                  onClick={close}
                />
              ) : null}
              {isAdmin ? (
                <DrawerItem
                  href="/admin"
                  title="Admin"
                  subtitle="Review & approve campaigns"
                  onClick={close}
                />
              ) : null}
            </div>

            <div className="space-y-3 pt-5">
              <Link
                href={isLoggedIn ? "/start" : "/signup"}
                onClick={close}
                className="block rounded-full bg-white px-5 py-4 text-center text-lg font-bold text-[#0f1211] no-underline"
              >
                {isLoggedIn ? "Start a campaign" : "Get started"}
              </Link>
              {isLoggedIn ? (
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-white/30 px-5 py-3 font-semibold"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  className="block rounded-full border border-white/30 px-5 py-3 text-center font-semibold text-white no-underline"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DrawerItem({
  href,
  title,
  subtitle,
  onClick,
}: {
  href: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-baseline justify-between gap-3 py-3.5 no-underline"
    >
      <span>
        <span className="block text-[26px] font-normal leading-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-white/45">{subtitle}</span>
      </span>
    </Link>
  );
}

function AccordionSection({
  sectionKey,
  label,
  subtitle,
  open,
  onToggle,
  onNavigate,
}: {
  sectionKey: string;
  label: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const items = MENUS[sectionKey].items;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-3 py-3.5 text-left"
      >
        <span>
          <span className="block text-[26px] font-normal leading-tight">
            {label}
            <span className="ml-2 text-white/50">{open ? "−" : "+"}</span>
          </span>
          <span className="mt-0.5 block text-sm text-white/45">{subtitle}</span>
        </span>
      </button>
      {open ? (
        <div className="space-y-1 border-l border-white/15 pb-3 pl-4">
          {items.map((item) => (
            <Link
              key={item.href + item.title}
              href={item.href}
              onClick={onNavigate}
              className="block rounded-lg px-2 py-2 no-underline hover:bg-white/5"
            >
              <span className="block font-semibold">{item.title}</span>
              <span className="block text-xs text-white/45">
                {item.subtitle}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
