"use client";

import { useActionState } from "react";
import { addCharity } from "./actions";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

export function CharityForm() {
  const [state, action, pending] = useActionState(addCharity, undefined);

  return (
    <form action={action} className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-sm font-bold text-brand">Add a verified charity</p>

      <label className="mt-3 block text-sm font-medium" htmlFor="name">
        Name
      </label>
      <input id="name" name="name" required className={inputClass} />

      <label className="mt-3 block text-sm font-medium" htmlFor="description">
        Short description
      </label>
      <input id="description" name="description" className={inputClass} />

      <label className="mt-3 block text-sm font-medium" htmlFor="logo_url">
        Logo URL (optional)
      </label>
      <input id="logo_url" name="logo_url" type="url" className={inputClass} />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="bkash_number">
            bKash / Nagad
          </label>
          <input id="bkash_number" name="bkash_number" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="bank_name">
            Bank name
          </label>
          <input id="bank_name" name="bank_name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="bank_account_name">
            Account holder
          </label>
          <input id="bank_account_name" name="bank_account_name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="bank_account_number">
            Account number
          </label>
          <input id="bank_account_number" name="bank_account_number" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="bank_branch">
            Branch
          </label>
          <input id="bank_branch" name="bank_branch" className={inputClass} />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}
      {state?.added ? (
        <p className="mt-3 text-sm text-brand">Charity added ✓</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add charity"}
      </button>
    </form>
  );
}
