/* What Shohay charges, in one place.

   Donations, fundraisers and occasion fundraisers pay nothing —
   that promise is the reason strangers give. A creator page is a
   different product: an ongoing page, monthly supporters, posts and
   special projects, all of it hosted and supported by Shohay. Those
   pay a platform fee.

   Every figure and every sentence about fees on the site comes from
   here, so the number can never be right in one place and wrong in
   another. */

/** Shohay's cut of money raised through a creator page. */
export const CREATOR_FEE_PCT = 15;

/** Roughly what bKash, Nagad, a card network or the bank takes to
    actually move the money. Not ours and not a fee we set. */
export const BANK_FEE_PCT = 3;

const CREATOR_FEE_RATE = CREATOR_FEE_PCT / 100;
const BANK_FEE_RATE = BANK_FEE_PCT / 100;

/** Does Shohay take a cut of this campaign? Creator projects do;
    fundraisers and occasion fundraisers do not. */
export function platformFeePct(campaignType?: string | null): number {
  return campaignType === "creator" ? CREATOR_FEE_PCT : 0;
}

function platformFeeRate(campaignType?: string | null): number {
  return campaignType === "creator" ? CREATOR_FEE_RATE : 0;
}

/** Shohay's share of an amount raised. */
export function platformFee(
  amount: number,
  campaignType?: string | null
): number {
  return Math.round((Number(amount) || 0) * platformFeeRate(campaignType));
}

/** What actually reaches them: after Shohay, then after the bank. */
export function netOf(amount: number, campaignType?: string | null): number {
  const gross = Number(amount) || 0;
  const afterUs = gross * (1 - platformFeeRate(campaignType));
  return Math.round(afterUs * (1 - BANK_FEE_RATE));
}

/* ---- The wording. Used verbatim wherever fees are mentioned. ---- */

/** For a badge or a footer line. */
export const FEE_SHORT = `0% on donations · ${CREATOR_FEE_PCT}% for creators`;

/** The full, honest version. */
export const FEE_SENTENCE =
  `Shohay takes 0% from donations, fundraisers and occasion fundraisers — ` +
  `every taka reaches the person who needs it. A creator page pays ` +
  `${CREATOR_FEE_PCT}% on everything it raises, monthly supporters and ` +
  `special projects alike.`;

export const FEE_SENTENCE_BN =
  `অনুদান ও ফান্ডরেইজিং থেকে সহায় কোনো ফি নেয় না (০%)। ক্রিয়েটর পেজের ` +
  `ক্ষেত্রে — মাসিক সমর্থন ও বিশেষ প্রজেক্ট — ১৫% ফি প্রযোজ্য।`;

/** For a creator being asked to agree to it. */
export const CREATOR_FEE_SENTENCE =
  `Shohay keeps ${CREATOR_FEE_PCT}% of everything your page raises — ` +
  `monthly supporters and special projects. That pays for your page, the ` +
  `verification our team does, and support when something goes wrong. ` +
  `The payment gateway's charge of about ${BANK_FEE_PCT}% comes off on top.`;
