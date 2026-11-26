"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { optimisedSrcSet } from "@/lib/image-srcset";

/* The homepage hero, built the way Patreon's is: a full-bleed photo or
   video with one very large headline over it and a credit line for
   whoever is in the shot — rotating through several of them.

   Slides come from site_media's hero rows, so Shohay adds and reorders
   them in /admin/homepage without a deploy. With none set it falls back
   to a single slide of brand colour, which still reads as a hero.

   Motion is deliberate and skippable: anyone who has asked their device
   for less of it gets no auto-advance, no crossfade and no drift. The
   arrows still work. */

export type HeroSlide = {
  id: string;
  kind: "image" | "video" | "color";
  url: string | null;
  title: string | null;
  titleBn: string | null;
  credit: string | null;
  creditHref: string | null;
};

const INTERVAL = 5000;

/* Whether this connection should be asked to carry a hero video.

   Read through useSyncExternalStore rather than an effect: it is a
   value that lives outside React and can change mid-visit when someone
   turns on data saver or walks out of Wi-Fi. The server snapshot is
   true, so the video is in the first paint for everyone who can afford
   it, and drops out for anyone who cannot. */
type Conn = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (t: string, cb: () => void) => void;
  removeEventListener?: (t: string, cb: () => void) => void;
};

function connectionOf(): Conn | undefined {
  return (navigator as Navigator & { connection?: Conn }).connection;
}

function subscribeToConnection(onChange: () => void) {
  const conn = connectionOf();
  conn?.addEventListener?.("change", onChange);
  return () => conn?.removeEventListener?.("change", onChange);
}

function connectionCarriesVideo(): boolean {
  const conn = connectionOf();
  if (!conn) return true;
  if (conn.saveData === true) return false;
  return conn.effectiveType ? !/^(slow-)?2g$/.test(conn.effectiveType) : true;
}

/* The headline animates a word at a time. Splitting on spaces keeps
   each word whole so nothing breaks mid-word as it rises. */
function Words({ text, reduced }: { text: string; reduced: boolean }) {
  if (reduced) return <>{text}</>;
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="word-up"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {word}
          {"\u00A0"}
        </span>
      ))}
    </>
  );
}

export function HeroCarousel({
  slides,
  fallbackTitle,
  fallbackTitleBn,
  ctaPrimary,
  ctaSecondary,
}: {
  slides: HeroSlide[];
  fallbackTitle: string;
  fallbackTitleBn: string;
  ctaPrimary: string;
  ctaSecondary: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  /* Every slide stays mounted so a crossfade has something to fade
     between — but a mounted <video autoplay> downloads and plays
     whether or not anyone can see it. With three video slides that was
     21.7 MB fetched on one page load, three of them playing at once,
     two of them invisible. Hold a handle on each and drive play/pause
     from the slide that is actually showing. */
  const videos = useRef(new Map<string, HTMLVideoElement>());

  const heavyOk = useSyncExternalStore(
    subscribeToConnection,
    connectionCarriesVideo,
    () => true
  );
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + count) % count),
    [count]
  );

  useEffect(() => {
    if (count < 2 || reduced || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count, reduced, paused]);

  // Pause while the tab is in the background; a hero rotating to nobody
  // just burns battery.
  const hidden = useRef(false);
  useEffect(() => {
    const onVis = () => {
      hidden.current = document.hidden;
      setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    slides.forEach((slide, i) => {
      const el = videos.current.get(slide.id);
      if (!el) return;
      if (i === index && heavyOk && !reduced) {
        void el.play().catch(() => {
          /* a browser may refuse autoplay; the still frame is fine */
        });
      } else if (!el.paused) {
        el.pause();
      }
    });
  }, [index, slides, heavyOk, reduced]);

  const active = slides[index] ?? slides[0];

  /* A slide's own words win. Falling back only when the slide has
     none — and an empty string is a real answer, meaning "no line
     here", not a reason to reach for the default. */
  const heroTitle = active?.title?.trim() ? active.title : fallbackTitle;
  const heroTitleBn = active?.titleBn?.trim()
    ? active.titleBn
    : fallbackTitleBn;

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0b1a14] text-white"
      /* Rides up under the floating header by exactly its height. */
      style={{ marginTop: "calc(-1 * var(--header-h, 61px))" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription={count > 1 ? "carousel" : undefined}
    >
      {/* Every slide stays mounted and crossfades, so a video does not
          restart each time the hero comes back round to it. */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.kind === "video" && slide.url && heavyOk ? (
            <video
              ref={(el) => {
                if (el) videos.current.set(slide.id, el);
                else videos.current.delete(slide.id);
              }}
              src={slide.url}
              muted
              loop
              playsInline
              /* Always "none", never toggled. Flipping this attribute
                 as a slide becomes active makes the browser throw away
                 what it had and fetch the file again — which is why one
                 9.2 MB clip was arriving as 18.5 MB. Nothing is fetched
                 until the effect above calls play() on the slide that is
                 actually showing. */
              preload="none"
              className="h-full w-full object-cover"
            />
          ) : slide.kind === "image" && slide.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.url}
              srcSet={optimisedSrcSet(slide.url)}
              sizes="100vw"
              alt=""
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget;
                // A resized copy failed: try the original file once
                // before giving up on the picture.
                if (img.srcset) {
                  img.srcset = "";
                  return;
                }
                // Same rule as everywhere else on the site: never leave
                // a broken image on a page asking strangers for money.
                // The wash below carries the headline on its own.
                img.style.display = "none";
              }}
              className={`h-full w-full object-cover ${
                reduced ? "" : "hero-drift"
              }`}
            />
          ) : null}
        </div>
      ))}

      {/* Wash: dark enough at the bottom for the headline to hold, clear
          at the top so the photograph is actually visible. An even wash
          over the whole frame hid the picture we went to the trouble of
          putting there. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a14] via-[#0b1a14]/60 to-[#0b1a14]/15" />

      {/* Full screen, as theirs is. A hero that stops short of the fold
          reads as a banner; one that fills it reads as a front page. */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20">
        {/* Keyed on the slide so the words replay each time it changes */}
        {/* Sized against the column it sits in, not the whole window.
            At 11vw a long headline ran the full width of a laptop and
            crowded everything under it; this tops out at a size that
            still reads as display type but leaves the picture room to
            be seen. max-w in characters keeps the line length sane at
            every width rather than only at the ones I happened to
            check. */}
        <h1
          key={`h-${index}`}
          className="max-w-[11ch] text-[clamp(2.5rem,6.2vw,5.5rem)] font-light leading-[0.95] tracking-[-0.02em] sm:max-w-[13ch]"
        >
          <Words text={heroTitle} reduced={reduced} />
        </h1>

        {heroTitleBn ? (
          <p
            key={`b-${index}`}
            className={`font-bengali mt-4 max-w-2xl text-base font-semibold text-white/75 sm:text-lg ${
              reduced ? "" : "fade-up-soft"
            }`}
            style={reduced ? undefined : { animationDelay: "320ms" }}
          >
            {heroTitleBn}
          </p>
        ) : null}

        <div
          key={`c-${index}`}
          className={`mt-8 flex flex-col gap-3 sm:flex-row ${
            reduced ? "" : "fade-up-soft"
          }`}
          style={reduced ? undefined : { animationDelay: "440ms" }}
        >
          <Link
            href="/setup"
            className="press inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-lg font-bold text-[#0b1a14] no-underline"
          >
            {ctaPrimary}
          </Link>
          <Link
            href="/creators"
            className="press inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-8 text-lg font-bold text-white no-underline hover:bg-white/10"
          >
            {ctaSecondary}
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <span
            aria-hidden="true"
            className="hidden text-4xl font-light text-white/70 sm:block"
          >
            ↓
          </span>
          {/* The credit line Patreon runs beside its hero photograph */}
          {active?.credit ? (
            active.creditHref ? (
              <Link
                href={active.creditHref}
                className="press flex w-fit items-center gap-2 text-sm font-semibold text-white/80 no-underline hover:text-white"
              >
                {active.credit}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span className="text-sm font-semibold text-white/80">
                {active.credit}
              </span>
            )
          ) : (
            <span />
          )}

          {count > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-xl hover:bg-white/10"
              >
                ‹
              </button>
              <span className="sr-only" aria-live="polite">
                Slide {index + 1} of {count}
              </span>
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="press flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-xl hover:bg-white/10"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
