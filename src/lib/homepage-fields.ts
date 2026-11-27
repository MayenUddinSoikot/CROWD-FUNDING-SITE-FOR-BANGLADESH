import {
  CREATOR_FEE_PCT,
  BANK_FEE_PCT,
  FEE_SENTENCE,
  FEE_SENTENCE_BN,
} from "@/lib/fees";

/* Every word on the homepage that Shohay can change without a deploy.

   One registry, used twice: the homepage reads the default from here
   when the database has no row, and the admin editor builds its form
   from the same list. Adding a field in one place is enough — there is
   no second list to forget.

   A blank row means "use the default", so clearing a box in the admin
   restores the shipped wording rather than leaving a gap. */

export type Field = {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
  hint?: string;
};

export type FieldGroup = {
  /* Matches a row in site_sections, so a whole block can be hidden. */
  section: string;
  title: string;
  blurb: string;
  canHide: boolean;
  fields: Field[];
};

export const HOMEPAGE_GROUPS: FieldGroup[] = [
  {
    section: "hero",
    title: "Hero banner",
    blurb:
      "The big rotating banner. Each slide can carry its own headline — these are used when a slide has none.",
    canHide: false,
    fields: [
      {
        key: "hero.title",
        label: "Headline",
        fallback: "The people who follow you can change a life.",
        multiline: true,
      },
      {
        key: "hero.title_bn",
        label: "Bengali line",
        fallback: "অনুদানে ০% ফি — প্রতিটি টাকা পৌঁছে যায়",
      },
      {
        key: "hero.cta_primary",
        label: "Main button",
        fallback: "Create your page",
      },
      {
        key: "hero.cta_secondary",
        label: "Second button",
        fallback: "Find a creator",
      },
    ],
  },
  {
    section: "creators",
    title: "Creators row",
    blurb: "The people raising on Shohay, shown newest and busiest first.",
    canHide: true,
    fields: [
      {
        key: "creators.title",
        label: "Heading",
        fallback: "Creators raising for Bangladesh",
      },
      {
        key: "creators.title_bn",
        label: "Bengali heading",
        fallback: "যাঁরা সাহায্য তুলছেন",
      },
      {
        key: "creators.empty_title",
        label: "When nobody has a page yet",
        fallback: "Be the first creator on Shohay",
      },
      {
        key: "creators.empty_body",
        label: "…and the line under it",
        fallback:
          "Build a page, bring the people who already follow you, and raise for someone who needs it.",
        multiline: true,
      },
    ],
  },
  {
    section: "mosaic",
    title: "Faces band",
    blurb:
      "The big headline with photographs through it. Shows Shohay's own creators once there are any; until then, credited stock photos of Bangladesh.",
    canHide: true,
    fields: [
      {
        key: "mosaic.title",
        label: "Headline",
        fallback: "Raised by the people around them.",
        multiline: true,
      },
      {
        key: "mosaic.title_bn",
        label: "Bengali line",
        fallback: "পাশে থাকা মানুষগুলোই তুলেছেন",
      },
      {
        key: "mosaic.body",
        label: "Paragraph",
        fallback:
          "Nobody here raised money from strangers first. They started with the people who already knew them — family, neighbours, the ones who follow them — and those people brought the rest.",
        multiline: true,
      },
      { key: "mosaic.cta", label: "Button", fallback: "Find a creator" },
    ],
  },
  {
    section: "control",
    title: "Your page, your way",
    blurb: "What a campaigner controls on their own page.",
    canHide: true,
    fields: [
      {
        key: "control.title",
        label: "Headline",
        fallback: "Your page, your way.",
      },
      {
        key: "control.title_bn",
        label: "Bengali line",
        fallback: "আপনার পেজ, আপনার নিয়মে",
      },
      {
        key: "control.body",
        label: "Paragraph",
        fallback:
          "Your photo, your story, your goal, in Bangla or English or both. Post updates only your supporters can read, or open them to everyone. Nothing goes on your page that you did not put there.",
        multiline: true,
      },
      { key: "control.cta", label: "Button", fallback: "Build your page" },
      {
        key: "control.fee_title",
        label: "Fee note — heading",
        fallback: `What a creator page costs: ${CREATOR_FEE_PCT}%`,
      },
      {
        key: "control.fee_body",
        label: "Fee note — text",
        fallback:
          `Shohay keeps ${CREATOR_FEE_PCT}% of everything a creator page raises — monthly supporters and special projects alike. That pays for the page, the verification our team does on every project, and someone to call when something goes wrong. The payment gateway's charge of about ${BANK_FEE_PCT}% comes off on top. Raising for a person or a cause instead? That stays 0%.`,
        multiline: true,
      },
      {
        key: "control.fee_body_bn",
        label: "Fee note — Bengali",
        fallback: FEE_SENTENCE_BN,
        multiline: true,
      },
    ],
  },
  {
    section: "direct",
    title: "Nothing in between",
    blurb: "The fee argument, stated as directness rather than price.",
    canHide: true,
    fields: [
      {
        key: "direct.title",
        label: "Headline",
        fallback: "Donors. Campaigners. Nothing in between.",
        multiline: true,
      },
      {
        key: "direct.title_bn",
        label: "Bengali line",
        fallback: "মাঝখানে কেউ নেই",
      },
      {
        key: "direct.body",
        label: "Paragraph",
        fallback:
          FEE_SENTENCE +
          " No listing fee, no cut of a one-off gift, and we show you every figure before you ask anyone to give.",
        multiline: true,
      },
      { key: "direct.cta", label: "Button", fallback: "How the money moves" },
    ],
  },
  {
    section: "ways",
    title: "More ways to raise",
    blurb: "The three ways to raise money on Shohay.",
    canHide: true,
    fields: [
      { key: "ways.title", label: "Heading", fallback: "More ways to raise" },
      {
        key: "ways.title_bn",
        label: "Bengali heading",
        fallback: "সাহায্য তোলার আরও উপায়",
      },
      {
        key: "ways.body",
        label: "Paragraph",
        fallback:
          "A campaign ends. Your page does not. On Shohay you can run a one-off appeal, take monthly support from the people who follow you, and let friends raise for you on their birthday — all from the same page.",
        multiline: true,
      },
      { key: "ways.one_title", label: "Card 1 — title", fallback: "One-off campaigns" },
      { key: "ways.one_title_bn", label: "Card 1 — Bengali", fallback: "একক ক্যাম্পেইন" },
      {
        key: "ways.one_body",
        label: "Card 1 — text",
        fallback:
          "A goal, a deadline and a story. Verified by our team before anyone can give.",
        multiline: true,
      },
      { key: "ways.two_title", label: "Card 2 — title", fallback: "Monthly supporters" },
      { key: "ways.two_title_bn", label: "Card 2 — Bengali", fallback: "মাসিক সমর্থক" },
      {
        key: "ways.two_body",
        label: "Card 2 — text",
        fallback:
          "Tiers from ৳100. Steady money you can plan around instead of starting from zero.",
        multiline: true,
      },
      {
        key: "ways.three_title",
        label: "Card 3 — title",
        fallback: "Occasion fundraisers",
      },
      {
        key: "ways.three_title_bn",
        label: "Card 3 — Bengali",
        fallback: "বিশেষ দিনের আবেদন",
      },
      {
        key: "ways.three_body",
        label: "Card 3 — text",
        fallback:
          "Ask for donations instead of presents. Your friends give, you choose who it reaches.",
        multiline: true,
      },
      { key: "ways.cta", label: "Button", fallback: "Set up your page" },
    ],
  },
  {
    section: "dashboard",
    title: "See what is working",
    blurb: "The dashboard section, with the drawn phone beside it.",
    canHide: true,
    fields: [
      { key: "dash.title", label: "Heading", fallback: "See what is working" },
      {
        key: "dash.title_bn",
        label: "Bengali heading",
        fallback: "কোনটা কাজ করছে দেখুন",
      },
      {
        key: "dash.body",
        label: "Paragraph",
        fallback:
          "Your dashboard shows who opened your campaign, how many of them gave, what your supporters pledge each month, and what lands in your bKash after the bank's charge. Share a link and watch what it brings back.",
        multiline: true,
      },
      {
        key: "dash.point_one",
        label: "Point 1",
        fallback: "Views, donors and the share who gave after viewing",
      },
      {
        key: "dash.point_two",
        label: "Point 2",
        fallback: "Monthly pledges, separately from one-off gifts",
      },
      {
        key: "dash.point_three",
        label: "Point 3",
        fallback: "What you raised for other people's campaigns",
      },
      { key: "dash.cta", label: "Button", fallback: "Open your dashboard" },
    ],
  },
  {
    section: "quote",
    title: "Quote from a campaigner",
    blurb:
      "Hidden until you write one. Only use a real quote from someone who agreed to it.",
    canHide: true,
    fields: [
      {
        key: "quote.text",
        label: "What they said",
        fallback: "",
        multiline: true,
        hint: "Leave empty to keep this section off the homepage.",
      },
      { key: "quote.name", label: "Who said it", fallback: "" },
      { key: "quote.role", label: "Their campaign or role", fallback: "" },
    ],
  },
  {
    section: "trust",
    title: "Trust band",
    blurb: "The green band with the three numbers.",
    canHide: true,
    fields: [
      {
        key: "trust.title",
        label: "Heading",
        fallback: "Bangladesh's trusted place to give",
      },
      {
        key: "trust.body",
        label: "Paragraph",
        fallback:
          "Every campaign is checked with a government ID and documents before it goes live. 0% platform fee on donations and fundraisers, secure bKash, Nagad and card payments, and an independent audit every year.",
        multiline: true,
      },
      { key: "trust.stat_one", label: "Number 1", fallback: "0%" },
      {
        key: "trust.stat_one_label",
        label: "Number 1 — label",
        fallback: "fee on donations",
      },
      { key: "trust.stat_two", label: "Number 2", fallback: "100%" },
      {
        key: "trust.stat_two_label",
        label: "Number 2 — label",
        fallback: "verified campaigns",
      },
      { key: "trust.stat_three", label: "Number 3", fallback: "3 days" },
      { key: "trust.stat_three_label", label: "Number 3 — label", fallback: "to payout" },
      { key: "trust.cta_primary", label: "Main button", fallback: "Start a campaign" },
      { key: "trust.cta_secondary", label: "Second button", fallback: "How it works" },
    ],
  },
  {
    section: "closing",
    title: "Closing call to action",
    blurb: "The last thing a reader sees before the footer.",
    canHide: true,
    fields: [
      {
        key: "closing.title",
        label: "Heading",
        fallback: "Your page takes ten minutes.",
      },
      {
        key: "closing.title_bn",
        label: "Bengali line",
        fallback: "আপনার পেজ বানাতে দশ মিনিট লাগে",
      },
      {
        key: "closing.body",
        label: "Paragraph",
        fallback:
          `Free to start, 0% from Shohay when you raise for a person or a cause, ${CREATOR_FEE_PCT}% on a creator page — and our team checks every campaign before it goes live. The people who already follow you are the ones who give first.`,
        multiline: true,
      },
      { key: "closing.cta_primary", label: "Main button", fallback: "Create your page" },
      {
        key: "closing.cta_secondary",
        label: "Second button",
        fallback: "See who needs help",
      },
    ],
  },
];


/* ===== The rest of the site =====

   Everything here is empty by default. An empty value means "use the
   page as it was built"; write something and it replaces that part of
   the page. That way nothing has to be re-typed to keep what is
   already there, and nothing is lost by experimenting. */
export const SITE_GROUPS: FieldGroup[] = [
  {
    section: "social",
    title: "Social media & contact",
    blurb:
      "Where the icons in the footer point, and how people reach Shohay. An icon with no address is hidden rather than linking nowhere.",
    canHide: false,
    fields: [
      { key: "social.facebook", label: "Facebook page address", fallback: "" },
      { key: "social.instagram", label: "Instagram", fallback: "" },
      { key: "social.youtube", label: "YouTube", fallback: "" },
      { key: "social.tiktok", label: "TikTok", fallback: "" },
      { key: "social.whatsapp", label: "WhatsApp (https://wa.me/880…)", fallback: "" },
      { key: "contact.email", label: "Contact email", fallback: "" },
      { key: "contact.phone", label: "Contact phone", fallback: "" },
      {
        key: "contact.address",
        label: "Address shown in the footer",
        fallback: "",
        multiline: true,
      },
      {
        key: "footer.tagline",
        label: "Footer line beside the logo",
        fallback: "",
        hint: "Leave empty to keep © Shohay · 0% on donations · Made in Bangladesh.",
      },
    ],
  },
  {
    section: "about",
    title: "About page",
    blurb:
      "Leave empty to keep the About page as built. Write here and your words replace it.",
    canHide: false,
    fields: [
      { key: "about.title", label: "Heading", fallback: "" },
      {
        key: "about.body",
        label: "The whole page",
        fallback: "",
        multiline: true,
        hint: "Blank lines start a new paragraph. A line ending in a colon is shown as a sub-heading.",
      },
    ],
  },
  {
    section: "faq",
    title: "Help & FAQ page",
    blurb: "Leave empty to keep the questions already on the page.",
    canHide: false,
    fields: [
      { key: "faq.title", label: "Heading", fallback: "" },
      {
        key: "faq.body",
        label: "The whole page",
        fallback: "",
        multiline: true,
        hint: "Write a question on its own line ending in a question mark, then its answer underneath.",
      },
    ],
  },
  {
    section: "terms",
    title: "Terms of use",
    blurb: "Leave empty to keep the terms already on the page.",
    canHide: false,
    fields: [
      { key: "terms.title", label: "Heading", fallback: "" },
      {
        key: "terms.body",
        label: "The whole page",
        fallback: "",
        multiline: true,
      },
    ],
  },
  {
    section: "privacy",
    title: "Privacy policy",
    blurb: "Leave empty to keep the policy already on the page.",
    canHide: false,
    fields: [
      { key: "privacy.title", label: "Heading", fallback: "" },
      {
        key: "privacy.body",
        label: "The whole page",
        fallback: "",
        multiline: true,
      },
    ],
  },
];

export const ALL_GROUPS: FieldGroup[] = [...HOMEPAGE_GROUPS, ...SITE_GROUPS];

/* Flat lookup, built once — across every group, so the save action
   accepts a key from any page rather than only the homepage. */
export const FIELD_DEFAULTS: Record<string, string> = Object.fromEntries(
  ALL_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.fallback]))
);

export const SECTION_TITLES: Record<string, string> = Object.fromEntries(
  HOMEPAGE_GROUPS.map((g) => [g.section, g.title])
);
