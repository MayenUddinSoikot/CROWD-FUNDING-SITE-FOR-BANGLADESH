import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { formatTaka } from "@/lib/format";

/* A creator, as a card.

   Patreon's homepage is built out of these: a cover, a face, a name
   and one line about the work. Faces are what make a creator platform
   read as people rather than listings, so the photo leads and the
   numbers stay small. */

export type CreatorCardData = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  focus?: string[] | null;
  supporters?: number;
  raised?: number;
};

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const name = creator.display_name ?? creator.username;
  const focus = (creator.focus ?? []).slice(0, 2);

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="lift group block overflow-hidden rounded-2xl bg-card shadow-soft no-underline"
    >
      <div className="aspect-[16/9] w-full">
        <SafeImage
          src={creator.cover_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          fallback={
            <div className="h-full w-full bg-gradient-to-br from-brand-dark via-brand to-brand-light" />
          }
        />
      </div>

      <div className="px-5 pb-5">
        {/* The avatar straddles the cover, as on the creator's own page */}
        <div className="-mt-8 h-16 w-16 overflow-hidden rounded-full ring-4 ring-card">
          <SafeImage
            src={creator.avatar_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-brand-tint text-xl font-bold text-brand-dark">
                {name.charAt(0).toUpperCase()}
              </div>
            }
          />
        </div>

        <p className="mt-3 truncate text-lg font-bold group-hover:text-brand">
          {name}
        </p>

        {creator.bio ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
            {creator.bio}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">@{creator.username}</p>
        )}

        {focus.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {focus.map((f) => (
              <span
                key={f}
                className="rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold text-brand-dark"
              >
                {f}
              </span>
            ))}
          </div>
        ) : null}

        {(creator.supporters ?? 0) > 0 || (creator.raised ?? 0) > 0 ? (
          <p className="mt-3 text-xs font-semibold text-muted">
            {(creator.supporters ?? 0) > 0
              ? `${creator.supporters} supporter${creator.supporters === 1 ? "" : "s"}`
              : null}
            {(creator.supporters ?? 0) > 0 && (creator.raised ?? 0) > 0
              ? " · "
              : null}
            {(creator.raised ?? 0) > 0
              ? `${formatTaka(creator.raised ?? 0)} raised`
              : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
