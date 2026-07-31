"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveCreatorProfile } from "./actions";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

type Profile = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export function CreatorProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveCreatorProfile, undefined);

  return (
    <form action={action} className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-sm font-bold text-brand">
        Your creator profile · ক্রিয়েটর প্রোফাইল
      </p>
      <p className="mt-1 text-xs opacity-60">
        Set a username to get a shareable profile page at
        shohay.com/creator/&lt;username&gt;.
      </p>

      <label className="mt-4 block text-sm font-medium" htmlFor="username">
        Username
      </label>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-sm opacity-50">/creator/</span>
        <input
          id="username"
          name="username"
          defaultValue={profile.username ?? ""}
          placeholder="dhaka-street-stories"
          className="flex-1 rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      <label className="mt-3 block text-sm font-medium" htmlFor="display_name">
        Display name
      </label>
      <input
        id="display_name"
        name="display_name"
        defaultValue={profile.display_name ?? ""}
        placeholder="Dhaka Street Stories"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="avatar_url">
        Avatar image URL (optional)
      </label>
      <input
        id="avatar_url"
        name="avatar_url"
        type="url"
        defaultValue={profile.avatar_url ?? ""}
        placeholder="https://…"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="bio">
        Short bio
      </label>
      <textarea
        id="bio"
        name="bio"
        rows={3}
        defaultValue={profile.bio ?? ""}
        placeholder="What you create and why people should support you."
        className={inputClass}
      />

      {state?.error ? (
        <p className="mt-3 text-sm text-accent">{state.error}</p>
      ) : null}
      {state?.saved ? (
        <p className="mt-3 text-sm text-brand">
          Saved ✓{" "}
          {profile.username ? (
            <Link href={`/creator/${profile.username}`} className="underline">
              View your profile
            </Link>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
