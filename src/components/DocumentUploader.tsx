"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { DocType } from "@/lib/types";

type Uploaded = {
  docType: DocType;
  path: string;
  fileName: string;
};

const BUCKET = "campaign-docs";

type Field = { docType: DocType; label: string; hint: string };

const FULL_FIELDS: Field[] = [
  { docType: "nid", label: "NID (national ID) — required", hint: "Front & back — photo or PDF" },
  { docType: "medical", label: "Medical reports", hint: "Prescriptions, reports — photo or PDF" },
  { docType: "cheque", label: "Bank cheque / statement", hint: "For payout verification" },
  { docType: "other", label: "Other supporting documents", hint: "Optional" },
];

const SIMPLE_FIELDS: Field[] = [
  { docType: "nid", label: "NID (national ID) — required", hint: "Front & back — photo or PDF" },
  { docType: "other", label: "Supporting documents", hint: "Anything that helps verify — photo or PDF" },
];

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "dat";
}

export function DocumentUploader({
  userId,
  simple = false,
}: {
  userId: string;
  simple?: boolean;
}) {
  const FIELDS = simple ? SIMPLE_FIELDS : FULL_FIELDS;
  const [items, setItems] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(docType: DocType, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const uploaded: Uploaded[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is larger than 10 MB.`);
          continue;
        }
        const path = `${userId}/${crypto.randomUUID()}.${extensionOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });

        if (upErr) {
          setError(`Could not upload ${file.name}: ${upErr.message}`);
          continue;
        }
        uploaded.push({ docType, path, fileName: file.name });
      }

      setItems((current) => [...current, ...uploaded]);
    } finally {
      setBusy(false);
    }
  }

  function remove(path: string) {
    setItems((current) => current.filter((i) => i.path !== path));
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.docType}>
            <label
              className="block text-sm font-medium"
              htmlFor={`file-${f.docType}`}
            >
              {f.label}
            </label>
            <input
              id={`file-${f.docType}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => handleFiles(f.docType, e.target.files)}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            <p className="mt-1 text-xs opacity-60">{f.hint}</p>
          </div>
        ))}
      </div>

      {busy ? (
        <p className="mt-3 text-sm text-brand">Uploading…</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.path}
              className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
            >
              <span className="truncate">
                <span className="opacity-60">
                  {FIELDS.find((f) => f.docType === item.docType)?.label}:{" "}
                </span>
                {item.fileName}
              </span>
              <button
                type="button"
                onClick={() => remove(item.path)}
                className="shrink-0 text-xs text-accent hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Submitted with the form; the server action reads this. */}
      <input type="hidden" name="documents" value={JSON.stringify(items)} />
    </div>
  );
}
