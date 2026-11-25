"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

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

const INTERVAL = 7000;

export function HeroCarousel({
  slides,
  fallbackTitle,
  fallbackTitleBn,
}: {
  slides: HeroSlide[];
  fallbackTitle: string;
  fallbackTitleBn: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
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

  const active = slides[index] ?? slides[0];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0b1a14] text-white"
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
          {slide.kind === "video" && slide.url ? (
            <video
              src={slide.url}
              autoPlay={!reduced}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : slide.kind === "image" && slide.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.url}
              alt=""
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

      <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-24 sm:px-6 sm:pb-16">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-xs font-bold sm:text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#35c08a]" />
          0% platform fee — always
        </span>

        <h1 className="mt-6 max-w-5xl text-[2.9rem] font-normal leading-[0.93] tracking-tight sm:text-7xl lg:text-[5.5rem]">
          {active?.title || fallbackTitle}
        </h1>
        <p className="font-bengali mt-5 max-w-2xl text-xl font-semibold text-white/85 sm:text-2xl">
          {active?.titleBn || fallbackTitleBn}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/setup"
            className="press inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-lg font-bold text-[#0b1a14] no-underline"
          >
            Create your page
          </Link>
          <Link
            href="/creators"
            className="press inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-8 text-lg font-bold text-white no-underline hover:bg-white/10"
          >
            Find a creator
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
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
