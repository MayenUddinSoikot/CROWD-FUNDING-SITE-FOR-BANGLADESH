"use client";

import { useActionState, useState } from "react";
import { updateGoal } from "./actions";

export function GoalForm({
  campaignId,
  currentGoal,
}: {
  campaignId: string;
  currentGoal: number;
}) {
  const [state, action, pending] = useActionState(updateGoal, undefined);
  const [goalAmount, setGoalAmount] = useState(String(currentGoal));

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <div>
        <label className="block text-sm font-medium" htmlFor="goal_amount">
          Goal amount (৳ Taka)
        </label>
        <input
          id="goal_amount"
          name="goal_amount"
          type="number"
          min={1}
          step={1}
          value={goalAmount}
          onChange={(e) => setGoalAmount(e.target.value)}
          className="mt-1 w-44 rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update goal"}
      </button>
      {state?.saved ? (
        <span className="text-sm text-brand">Saved ✓</span>
      ) : null}
      {state?.error ? (
        <span className="text-sm text-accent">{state.error}</span>
      ) : null}
    </form>
  );
}
