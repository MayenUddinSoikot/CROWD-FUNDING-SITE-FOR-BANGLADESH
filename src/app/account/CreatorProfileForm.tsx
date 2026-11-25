"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveCreatorProfile } from "./actions";
import { SOCIAL_PLATFORMS } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-xl border border-foreground/20 bg-card px-4 py-2.5 outline-none focus:border-brand";

type Profile = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  full_name?: string | null;
  phone?: string | null;
  social_links?: Record<string, string> | null;
};

export function CreatorProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email?: string | null;
}) {
  const [state, action, pending] = useActionState(saveCreatorProfile, undefined);
  // Controlled so a validation error (e.g. username taken) never wipes
  // out edits you just typed into the other fields.
  const [username, setUsername] = useState(profile.username ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.cover_url ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [socials, setSocials] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SOCIAL_PLATFORMS.map((p) => [p.key, profile.social_links?.[p.key] ?? ""])
    )
  );

  return (
    <form action={action} className="rounded-2xl border border-foreground/10 bg-card p-5">
      <p className="text-sm font-bold text-brand">
        Your creator profile · ক্রিয়েটর প্রোফাইল
      </p>
      <p className="mt-1 text-xs opacity-60">
        Set a username to get a shareable profile page at
        shohay.org/creator/&lt;username&gt;.
      </p>

      <p className="mt-5 text-sm font-bold">Your details</p>
      <p className="mt-0.5 text-xs opacity-60">
        Private &amp; confidential — only our internal verification team sees
        these. They are never shown on your public page.
      </p>

      <label className="mt-3 block text-sm font-medium" htmlFor="full_name">
        Your name or organisation
      </label>
      <input
        id="full_name"
        name="full_name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="As written on your NID, or your organisation's name"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="phone">
        Mobile number
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="01712345678"
        className={inputClass}
      />

      <p className="mt-3 block text-sm font-medium">Email</p>
      <p className="mt-1 rounded-xl bg-background px-4 py-2.5 text-sm opacity-70">
        {email ?? "—"}
      </p>
      <p className="mt-1 text-xs opacity-60">
        This is how you log in, so it can&rsquo;t be changed here. Message us
        if you need it moved to another address.
      </p>

      <p className="mt-6 text-sm font-bold">Your public page</p>

      <label className="mt-4 block text-sm font-medium" htmlFor="username">
        Username
      </label>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-sm opacity-50">/creator/</span>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
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
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://…"
        className={inputClass}
      />

      <label className="mt-3 block text-sm font-medium" htmlFor="cover_url">
        Cover image URL (optional)
      </label>
      <input
        id="cover_url"
        name="cover_url"
        type="url"
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        placeholder="https://…"
        className={inputClass}
      />
      <p className="mt-1 text-xs opacity-60">
        The wide banner across the top of your page. Landscape works best —
        around 1500 x 500.
      </p>

      <label className="mt-3 block text-sm font-medium" htmlFor="bio">
        Short bio
      </label>
      <textarea
        id="bio"
        name="bio"
        rows={3}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="What you create and why people should support you."
        className={inputClass}
      />

      <p className="mt-5 text-sm font-medium">
        Where people can find your work (optional)
      </p>
      <p className="mt-0.5 text-xs opacity-60">
        Shown as buttons on your public page so supporters can see what you do.
      </p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key}>
            <label
              className="block text-sm font-medium"
              htmlFor={`social_${p.key}`}
            >
              {p.emoji} {p.label}
            </label>
            <input
              id={`social_${p.key}`}
              name={`social_${p.key}`}
              type="url"
              value={socials[p.key] ?? ""}
              onChange={(e) =>
                setSocials((cur) => ({ ...cur, [p.key]: e.target.value }))
              }
              placeholder={p.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>

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
