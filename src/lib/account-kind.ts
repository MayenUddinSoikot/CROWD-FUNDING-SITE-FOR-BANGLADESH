/* What an account raises as.

   Shohay has three different jobs and they were all being funnelled
   through one long form that asked a creator for a beneficiary's name
   and relationship — questions that only make sense when you are
   raising for somebody else.

   The kind is chosen once, stored on the profile, and from then on it
   decides which form someone sees, what their own campaigns are
   called, and the wording on their dashboard. */

export type AccountKind = "creator" | "fundraiser" | "occasion";

export type AccountKindInfo = {
  key: AccountKind;
  emoji: string;
  title: string;
  bn: string;
  desc: string;
  /* What this account's campaigns are called, everywhere. */
  noun: string;
  nounPlural: string;
  nounBn: string;
  /* The button that opens the form. */
  startLabel: string;
  startHint: string;
  /* Headings on the form itself. */
  formTitle: string;
  formTitleBn: string;
};

export const ACCOUNT_KINDS: AccountKindInfo[] = [
  {
    key: "creator",
    emoji: "☕",
    title: "A creator page",
    bn: "ক্রিয়েটর পেজ",
    desc: "Your own page, with monthly supporters and posts. Raise for a special project whenever you need one.",
    noun: "project",
    nounPlural: "projects",
    nounBn: "প্রজেক্ট",
    startLabel: "Raise for a special project",
    startHint: "A one-off goal on top of your monthly support",
    formTitle: "Raise for a special project",
    formTitleBn: "বিশেষ প্রজেক্টের জন্য তহবিল",
  },
  {
    key: "fundraiser",
    emoji: "🤝",
    title: "Raising for someone",
    bn: "তহবিল সংগ্রহ",
    desc: "Medical, education, disaster or a cause — for yourself, your family, or someone who needs it.",
    noun: "campaign",
    nounPlural: "campaigns",
    nounBn: "ক্যাম্পেইন",
    startLabel: "Start a campaign",
    startHint: "Checked by our team before it goes live",
    formTitle: "Start a campaign",
    formTitleBn: "ক্যাম্পেইন শুরু করুন",
  },
  {
    key: "occasion",
    emoji: "🎂",
    title: "An occasion fundraiser",
    bn: "বিশেষ দিনের তহবিল",
    desc: "Your birthday, wedding or anniversary — friends chip in and every taka goes to a verified charity.",
    noun: "occasion fundraiser",
    nounPlural: "occasion fundraisers",
    nounBn: "তহবিল",
    startLabel: "Start an occasion fundraiser",
    startHint: "Friends give to a verified charity to mark your day",
    formTitle: "Start an occasion fundraiser",
    formTitleBn: "বিশেষ দিনের তহবিল",
  },
];

const BY_KEY = new Map(ACCOUNT_KINDS.map((k) => [k.key, k]));

export function isAccountKind(value: unknown): value is AccountKind {
  return typeof value === "string" && BY_KEY.has(value as AccountKind);
}

/** Never throws — an account with nothing chosen yet reads as a fundraiser,
    which is the form that asks for everything. */
export function accountKind(value: unknown): AccountKindInfo {
  return (isAccountKind(value) && BY_KEY.get(value)) || BY_KEY.get("fundraiser")!;
}
