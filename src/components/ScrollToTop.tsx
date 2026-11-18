"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* Opening a page should start you at the top of it.

   Two cases are deliberately left alone:
   - Back and forward, where you expect your old position returned.
   - Links to a section (#campaigns), which should land on that section. */

export function ScrollToTop() {
  const pathname = usePathname();
  const cameFromHistory = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // The first load is already where the browser wants it.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (cameFromHistory.current) {
      cameFromHistory.current = false;
      return;
    }
    if (window.location.hash) return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
