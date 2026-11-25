import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

/* Patreon's "Creativity powered by fandom": a very large headline with
   photographs of real creators staggered through and over it.

   Ours shows Shohay's own creators the moment there are any. Until
   then it falls back to credited stock photographs of Bangladesh —
   deliberately NOT captioned with invented names, because a face
   presented as a campaigner who does not exist is a lie told on a page
   asking strangers for money. The fallback tiles carry a photo credit
   instead of a name. */

export type MosaicTile = {
  id: string;
  url: string;
  /* Set only for real people who chose to be here. */
  name?: string | null;
  href?: string | null;
  credit?: string | null;
};

/* Each tile gets its own height and vertical nudge, so the row reads as
   a scatter rather than a filmstrip. */
const SHAPES = [
  "aspect-[3/4] sm:translate-y-6",
  "aspect-[4/5] sm:-translate-y-4",
  "aspect-[3/4] sm:translate-y-10",
  "aspect-[4/5] sm:-translate-y-2",
];

export function PhotoMosaic({
  title,
  titleBn,
  body,
  tiles,
  cta,
  ctaHref,
}: {
  title: string;
  titleBn: string;
  body: string;
  tiles: MosaicTile[];
  cta: string;
  ctaHref: string;
}) {
  if (tiles.length === 0) return null;

  return (
    <section className="w-full overflow-hidden bg-brand-tint/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="max-w-4xl text-[2.4rem] font-normal leading-[0.98] tracking-tight text-brand-dark sm:text-6xl lg:text-7xl">
          {title}
        </h2>

        {/* The tiles ride up into the headline, as Patreon's do */}
        <div className="-mt-2 grid grid-cols-2 gap-4 sm:-mt-6 sm:grid-cols-4 sm:gap-5">
          {tiles.slice(0, 4).map((tile, i) => (
            <figure
              key={tile.id}
              className={`group relative m-0 mt-8 overflow-hidden rounded-2xl bg-brand-tint shadow-lift sm:mt-16 ${SHAPES[i % SHAPES.length]}`}
            >
              <SafeImage
                src={tile.url}
                alt=""
                loading="lazy"
                sizes="(min-width: 640px) 25vw, 50vw"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                fallback={<span className="block h-full w-full" />}
              />

              {tile.name ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  {tile.href ? (
                    <Link
                      href={tile.href}
                      className="text-sm font-bold text-white no-underline"
                    >
                      {tile.name} →
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {tile.name}
                    </span>
                  )}
                </figcaption>
              ) : tile.credit ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-[10px] font-semibold leading-tight text-white/80">
                  {tile.credit}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>

        <p className="font-bengali mt-10 text-xl font-semibold text-brand">
          {titleBn}
        </p>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-body">
          {body}
        </p>

        <Link
          href={ctaHref}
          className="press mt-7 inline-flex min-h-[52px] items-center justify-center rounded-full bg-brand-dark px-8 text-lg font-bold text-white no-underline hover:brightness-110"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
