"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/* The header bar, which floats over the hero on the homepage.

   Patreon's sits transparent on top of the photograph and turns solid
   once you scroll past it. Everywhere else on Shohay it stays the
   ordinary solid bar, because there is no photograph to float over. */

export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  /* Publish the bar's real height so the hero can sit exactly under it.
     It is 75px on a laptop and 61px on a phone, and changes again with
     the reader's font size, so a hard-coded number leaves a strip of
     background showing above the photograph. Measure it instead. */
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`
      );
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      ref={ref}
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
