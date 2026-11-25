/* Referral attribution.

   A creator shares shohay.org/campaigns/<slug>?via=<their username>.
   The username is kept in a cookie for 30 days, and whatever is in that
   cookie when someone donates is who gets the credit — last touch wins,
   which is the rule creators expect and the one every other platform
   uses. */

export const REFERRAL_COOKIE = "shohay_via";
export const REFERRAL_DAYS = 30;

/** Usernames are lowercase letters, numbers, dots, dashes, underscores. */
export function cleanUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9._-]{2,40}$/.test(value)) return null;
  return value;
}

/** The link a creator shares for a campaign. */
export function referralLink(
  siteUrl: string,
  path: string,
  username: string
): string {
  const base = siteUrl.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}?via=${encodeURIComponent(username)}`;
}
