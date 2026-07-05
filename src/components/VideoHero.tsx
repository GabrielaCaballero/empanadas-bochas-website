"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export default function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  }

  return (
    <section className="grid w-full grid-cols-1 sm:grid-cols-2">
      <div className="flex flex-col items-start justify-center gap-6 bg-terracotta px-8 py-16 sm:py-24">
        <span className="text-sm font-semibold tracking-wide text-cream/80 uppercase">
          Made to share
        </span>
        <h2 className="font-display text-4xl font-bold text-cream sm:text-5xl">
          One bite, back to Buenos Aires
        </h2>
        <p className="max-w-sm text-cream/85">
          Every empanada is folded and baked by hand, the same way our
          family&rsquo;s always made them.
        </p>
        <Link
          href="/shop"
          className="rounded-full bg-maroon px-6 py-3 font-semibold text-cream transition-colors hover:bg-maroon/80"
        >
          Shop the Menu
        </Link>
      </div>

      <div className="relative aspect-square overflow-hidden sm:aspect-auto">
        <video
          ref={videoRef}
          src="/video/empanada-cut.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-maroon backdrop-blur-sm"
        >
          {playing ? "❚❚" : "▶"}
        </button>
      </div>
    </section>
  );
}
