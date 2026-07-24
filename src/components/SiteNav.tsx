"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

type MenuItem = { title: string; subtitle: string; href: string };

const MENUS: Record<string, { heading: string; items: MenuItem[] }> = {
  donate: {
    heading: "Discover campaigns to support",
    items: [
      { title: "Browse all campaigns", subtitle: "Every live campaign", href: "/search" },
      { title: "🎂 Occasion fundraisers", subtitle: "Birthdays, weddings & more", href: "/search?filter=birthday" },
      { title: "☕ Support a creator", subtitle: "Buy creators a cha", href: "/search?filter=creators" },
      { title: "Disaster relief", subtitle: "Give to verified relief", href: "/search?category=disaster_relief" },
      { title: "Medical", subtitle: "Help with medical costs", href: "/search?category=medical" },
      { title: "Education", subtitle: "Support students", href: "/search?category=education" },
    ],
  },
  fundraise: {
    heading: "Start a campaign — 0% platform fee",
    items: [
      { title: "Start a fundraiser", subtitle: "Medical, education, a cause", href: "/start" },
      { title: "🎂 Occasion fundraiser", subtitle: "Raise on your birthday", href: "/start" },
      { title: "☕ Creator page", subtitle: "Ongoing supporter page", href: "/start" },
      { title: "How it works", subtitle: "Step by step", href: "/#how" },
    ],
  },
  about: {
    heading: "How Shohay works, and more",
    items: [
      { title: "How Shohay works", subtitle: "Verify, fund, payout", href: "/#how" },
      { title: "0% platform fee", subtitle: "Every taka reaches the campaign", href: "/#how" },
      { title: "Verified campaigns", subtitle: "NID & document checked", href: "/#how" },
      { title: "Help & FAQ", subtitle: "Support in Bangla & English", href: "/#how" },
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
        <Dropdown id="donate" label="Donate" menu={menu} setMenu={setMenu} />
        <Dropdown id="fundraise" label="Fundraise" menu={menu} setMenu={setMenu} />
        <Dropdown id="about" label="About" menu={menu} setMenu={setMenu} />
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
          <Link href="/login" className="hover:text-brand">
            Sign in
          </Link>
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
        <Link href="/search" aria-label="Search" className="text-lg">
          🔍
        </Link>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/20 text-lg"
        >
          ☰
        </button>
      </div>

      {/* Right-side drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="absolute right-0 top-0 flex h-full w-4/5 max-w-xs flex-col bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="self-end text-2xl opacity-60"
            >
              ✕
            </button>

            <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
              <DrawerItem
                href={isLoggedIn ? "/account" : "/login"}
                title="Manage your activity"
                subtitle="Your donations and campaigns"
                onClick={close}
              />
              <DrawerItem
                href="/search"
                title="Donate"
                subtitle="Discover campaigns to support"
                onClick={close}
              />
              <DrawerItem
                href="/start"
                title="Fundraise"
                subtitle="Start a campaign, 0% platform fee"
                onClick={close}
              />
              <DrawerItem
                href="/#how"
                title="About"
                subtitle="How Shohay works"
                onClick={close}
              />
              {isAdmin ? (
                <DrawerItem
                  href="/admin"
                  title="Admin"
                  subtitle="Review & approve campaigns"
                  onClick={close}
                />
              ) : null}
            </div>

            <div className="space-y-3 pt-4">
              <Link
                href="/start"
                onClick={close}
                className="block rounded-full bg-brand px-5 py-3 text-center font-semibold text-white"
              >
                Start a campaign
              </Link>
              {isLoggedIn ? (
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-foreground/20 px-5 py-3 font-semibold"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  className="block rounded-full border border-foreground/20 px-5 py-3 text-center font-semibold"
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
      className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-foreground/5"
    >
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm opacity-60">{subtitle}</span>
      </span>
      <span className="opacity-40">›</span>
    </Link>
  );
}
