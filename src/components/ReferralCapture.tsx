"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  REFERRAL_COOKIE,
  REFERRAL_DAYS,
  cleanUsername,
} from "@/lib/referral";

/* Remembers who sent this visitor.

   Reads ?via= straight off window.location rather than useSearchParams,
   on purpose: useSearchParams would force every page that renders this
   into dynamic rendering (or need a Suspense boundary around it), and
   the static pages — about, FAQ, terms — should stay static. */

export function ReferralCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const via = cleanUsername(
      new URLSearchParams(window.location.search).get("via")
    );
    if (!via) return;

    const expires = new Date(
      Date.now() + REFERRAL_DAYS * 24 * 60 * 60 * 1000
    ).toUTCString();

    try {
      document.cookie =
        `${REFERRAL_COOKIE}=${encodeURIComponent(via)}; path=/; ` +
        `expires=${expires}; SameSite=Lax`;
    } catch {
      // Cookies blocked. The donation simply goes uncredited.
    }
  }, [pathname]);

  return null;
}
