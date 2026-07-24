"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

export function SiteNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-4 text-sm lg:flex">
        <Link href="/search" className="hover:text-brand">
          Donate
        </Link>
        <Link href="/start" className="hover:text-brand">
          Fundraise
        </Link>
        <Link href="/#how" className="hover:text-brand">
          About
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
