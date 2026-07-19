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

  const links = (
    <>
      <Link href="/#campaigns" className="hover:text-brand" onClick={() => setOpen(false)}>
        Campaigns · <span className="font-bengali">ক্যাম্পেইন</span>
      </Link>
      {isLoggedIn ? (
        <Link href="/account" className="hover:text-brand" onClick={() => setOpen(false)}>
          My campaigns
        </Link>
      ) : null}
      {isAdmin ? (
        <Link href="/admin" className="font-semibold hover:text-brand" onClick={() => setOpen(false)}>
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
        <Link href="/login" className="hover:text-brand" onClick={() => setOpen(false)}>
          Log in
        </Link>
      )}
      <Link
        href="/start"
        className="rounded-full bg-brand px-4 py-2 text-center font-semibold text-white transition hover:bg-brand-dark"
        onClick={() => setOpen(false)}
      >
        Start a campaign
      </Link>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-4 text-sm sm:flex">{links}</nav>

      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/20 sm:hidden"
      >
        <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div className="absolute inset-x-0 top-full z-20 flex flex-col gap-3 border-b border-foreground/10 bg-background px-6 py-4 text-sm shadow-lg sm:hidden">
          {links}
        </div>
      ) : null}
    </>
  );
}
