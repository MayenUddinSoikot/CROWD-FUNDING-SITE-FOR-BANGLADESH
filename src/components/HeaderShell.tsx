"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/* The header bar, which floats over the hero on the homepage.

   Patreon's sits transparent on top of the photograph and turns solid
   once you scroll past it. Everywhere else on Shohay it stays the
   ordinary solid bar, because there is no photograph to float over. */

export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!onHome) return;
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  const floating = onHome && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        floating
          ? "over-hero border-b border-transparent bg-transparent"
          : "border-b border-foreground/[0.07] bg-background"
      }`}
    >
      {children}
    </header>
  );
}
