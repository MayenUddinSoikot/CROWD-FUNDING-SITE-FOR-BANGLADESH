/* What a creator raises for — Patreon's "what do you create?" step.

   Kept out of the server-actions file on purpose: a "use server"
   module may only export async functions, and exporting a constant
   from one fails at request time rather than at build time. */

export const FOCUS_OPTIONS = [
  "Medical",
  "Education",
  "Disaster relief",
  "Community",
  "Creator / content",
  "Occasion fundraisers",
  "Animals",
  "Other",
] as const;
