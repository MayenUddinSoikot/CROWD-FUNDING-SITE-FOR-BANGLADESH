"use client";

import { useState } from "react";
import type { PublicCharity } from "@/lib/types";

type Row = { charity_id: string; percentage: number };

const inputClass =
  "rounded-xl border border-foreground/20 bg-card px-3 py-2 outline-none focus:border-brand";

export function CharityAllocator({ charities }: { charities: PublicCharity[] }) {
  const [rows, setRows] = useState<Row[]>([{ charity_id: "", percentage: 100 }]);

  const total = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
  const totalOk = total === 100;

  function update(i: number, patch: Partial<Row>) {
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((cur) => [...cur, { charity_id: "", percentage: 0 }]);
  }
  function removeRow(i: number) {
    setRows((cur) => cur.filter((_, j) => j !== i));
  }

  const valid = rows.filter((r) => r.charity_id);

  return (
    <div>
      <p className="text-sm font-medium">
        Which charities get the funds? · কোন দাতব্য সংস্থা
      </p>
      <p className="mt-1 text-xs opacity-60">
        Pick one or more verified charities. The percentages must add up to
        100%. Funds go directly to the charities — not to you.
      </p>

      {charities.length === 0 ? (
        <p className="mt-3 text-sm text-accent">
          No verified charities are available yet. Ask the admin to add some.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.charity_id}
                onChange={(e) => update(i, { charity_id: e.target.value })}
                className={`${inputClass} flex-1`}
              >
                <option value="">Choose a charity…</option>
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={row.percentage}
                  onChange={(e) =>
                    update(i, { percentage: Number(e.target.value) })
                  }
                  className={`${inputClass} w-20 text-right`}
                />
                <span className="text-sm opacity-60">%</span>
              </div>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Remove charity"
                  className="text-accent"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addRow}
              className="text-sm font-semibold text-brand hover:underline"
            >
              + Add another charity
            </button>
            <span
              className={`text-sm font-semibold ${totalOk ? "text-brand" : "text-accent"}`}
            >
              Total: {total}%
            </span>
          </div>
          {!totalOk ? (
            <p className="text-xs text-accent">Percentages must add up to 100%.</p>
          ) : null}
        </div>
      )}

      <input
        type="hidden"
        name="charities"
        value={JSON.stringify(totalOk ? valid : [])}
      />
    </div>
  );
}
