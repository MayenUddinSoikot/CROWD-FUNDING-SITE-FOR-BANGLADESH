"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/admin";
import { FIELD_DEFAULTS } from "@/lib/homepage-fields";

export type ContentState =
  | { error?: string; saved?: boolean; section?: string }
  | undefined;

/* Save one group of homepage wording.

   A box left empty deletes its row rather than storing "", so the
   wording shipped in the code comes back. That makes every field
   reversible without anyone needing to remember the original words. */
export async function saveHomepageText(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const supabase = await getAdminClient();
  if (!supabase) return { error: "Admins only." };

  const section = String(formData.get("__section") ?? "");
  const rows: { key: string; value: string }[] = [];
  const clear: string[] = [];

  for (const [key, raw] of formData.entries()) {
    if (key.startsWith("__")) continue;
    if (!(key in FIELD_DEFAULTS)) continue; // ignore anything not ours
    const value = String(raw).trim();
    if (value === "") clear.push(key);
    else rows.push({ key, value });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .upsert(
        rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: "key" }
      );
    if (error) {
      console.error("Failed to save homepage text:", error.message);
      return {
        error:
          error.code === "42P01"
            ? "Run supabase/site-theme.sql in Supabase first."
            : "Could not save. Please try again.",
        section,
      };
    }
  }

  if (clear.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .delete()
      .in("key", clear);
    if (error) {
      console.error("Failed to clear homepage text:", error.message);
      return { error: "Saved, but some fields could not be reset.", section };
    }
  }

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { saved: true, section };
}

/* Show or hide a whole block of the homepage. */
export async function toggleSection(formData: FormData) {
  const supabase = await getAdminClient();
  if (!supabase) return;

  const key = String(formData.get("key") ?? "");
  if (!key) return;
  const visible = String(formData.get("visible")) === "true";

  await supabase.from("site_sections").upsert(
    { key, visible, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}
