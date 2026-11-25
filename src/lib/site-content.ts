import { getSupabaseClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FIELD_DEFAULTS } from "@/lib/homepage-fields";

/* Reading the homepage's words and which sections are switched on.

   Both reads fail softly. If site-theme.sql has not been run, or the
   database is unreachable, the homepage still renders with the wording
   shipped in the code — a content table that is missing should never
   take the front page down. */

export type SiteContent = Map<string, string>;

export async function getSiteContent(): Promise<SiteContent> {
  const map: SiteContent = new Map();
  if (!isSupabaseConfigured()) return map;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key, value");
    if (error) return map;
    for (const row of data ?? []) {
      const value = (row as { key: string; value: string | null }).value;
      // A blank row means "use the default", not "show nothing".
      if (typeof value === "string" && value.trim() !== "") {
        map.set((row as { key: string }).key, value);
      }
    }
  } catch {
    /* keep the defaults */
  }
  return map;
}

/* Sections an admin has switched off. Absent table → nothing hidden. */
export async function getHiddenSections(): Promise<Set<string>> {
  const hidden = new Set<string>();
  if (!isSupabaseConfigured()) return hidden;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_sections")
      .select("key, visible");
    if (error) return hidden;
    for (const row of data ?? []) {
      const r = row as { key: string; visible: boolean };
      if (r.visible === false) hidden.add(r.key);
    }
  } catch {
    /* nothing hidden */
  }
  return hidden;
}

/* The value an admin set, else the wording shipped in the code. */
export function text(content: SiteContent, key: string): string {
  const set = content.get(key);
  if (set !== undefined) return set;
  return FIELD_DEFAULTS[key] ?? "";
}
