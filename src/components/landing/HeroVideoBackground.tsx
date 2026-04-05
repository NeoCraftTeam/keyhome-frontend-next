'use client';

import type { SyntheticEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_VIDEOS = [
  '/videos/hero1.mp4',
  '/videos/hero2.mp4',
  '/videos/hero3.mp4',
  '/videos/hero4.mp4',
  '/videos/hero5.mp4',
];

const SHOWCASE_IMAGES = [
  '/images/maison-blanche.webp',
  '/images/04Final.webp',
  '/images/2.webp',
];

const SLIDE_DURATION = 5000;
const CROSSFADE_MS = 1000;

/** Slower hero motion; must be re-applied after `load()` (browsers reset rate to 1). */
const VIDEO_PLAYBACK_SPEED = 0.8;

function applyHeroPlaybackRate(el: HTMLVideoElement): void {
  el.defaultPlaybackRate = VIDEO_PLAYBACK_SPEED;
  el.playbackRate = VIDEO_PLAYBACK_SPEED;
}

function handleVideoPlaybackRateSync(
  e: SyntheticEvent<HTMLVideoElement>
): void {
  applyHeroPlaybackRate(e.currentTarget);
}

function slotElement(
  slot: 0 | 1,
  a: HTMLVideoElement | null,
  b: HTMLVideoElement | null
): HTMLVideoElement | null {
  return slot === 0 ? a : b;
}

/** Returns true if the user has requested reduced motion at the OS level. */
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Hero background: cycles through optimized hero videos with crossfade,
 * falling back to an animated property image slideshow on error.
 * When the user prefers reduced motion, a static image is shown instead.
 *
 * Uses two decoders (A/B): the inactive slot always preloads the *next* clip.
 * After a crossfade we only swap which slot is visible — we never `load()` the
 * same file again on the visible element, so playback does not restart from 0.
 */
export default function HeroVideoBackground({ isDark }: { isDark: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  /** Index of the clip currently playing on `activeSlot`. */
  const [leadIndex, setLeadIndex] = useState(0);
  /** Which `<video>` (0 = videoRef, 1 = nextVideoRef) is the visible player. */
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [crossfadeTo, setCrossfadeTo] = useState<0 | 1 | null>(null);
  const [isCrossfading, setIsCrossfading] = useState(false);

  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const activeSlotRef = useRef<0 | 1>(0);
  const leadIndexRef = useRef(0);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    leadIndexRef.current = leadIndex;
  }, [leadIndex]);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  /** First clip on slot 0 (once). */
  useEffect(() => {
    if (videoError) {
      return;
    }
    const el = videoRef.current;
    if (!el || el.src) {
      return;
    }
    el.src = HERO_VIDEOS[0];
    el.load();
    applyHeroPlaybackRate(el);
    void el.play().catch(() => {});
  }, [videoError]);

  /**
   * Inactive slot preloads the following clip (paused) so `ended` can crossfade
   * without assigning `src` at the last moment.
   */
  useEffect(() => {
    if (videoError || isCrossfading) {
      return;
    }
    const inactive: 0 | 1 = activeSlot === 0 ? 1 : 0;
    const el = slotElement(inactive, videoRef.current, nextVideoRef.current);
    if (!el) {
      return;
    }
    const nextIdx = (leadIndex + 1) % HERO_VIDEOS.length;
    const url = HERO_VIDEOS[nextIdx];
    if (el.src.endsWith(url)) {
      return;
    }
    el.src = url;
    el.load();
    applyHeroPlaybackRate(el);
  }, [leadIndex, activeSlot, videoError, isCrossfading]);

  const handleSlotEnded = useCallback(
    (endedSlot: 0 | 1) => {
      if (endedSlot !== activeSlotRef.current || videoError) {
        return;
      }
      const incoming: 0 | 1 = endedSlot === 0 ? 1 : 0;
      const nextEl = slotElement(
        incoming,
        videoRef.current,
        nextVideoRef.current
      );
      if (!nextEl) {
        return;
      }
      const nextIdx = (leadIndexRef.current + 1) % HERO_VIDEOS.length;
      const url = HERO_VIDEOS[nextIdx];
      if (!nextEl.src.endsWith(url)) {
        nextEl.src = url;
        nextEl.load();
        applyHeroPlaybackRate(nextEl);
      }
      void nextEl.play().catch(() => {});

      setCrossfadeTo(incoming);
      setIsCrossfading(true);

      window.setTimeout(() => {
        const oldSlot = endedSlot;
        const oldEl = slotElement(
          oldSlot,
          videoRef.current,
          nextVideoRef.current
        );
        oldEl?.pause();

        setActiveSlot(incoming);
        setLeadIndex(nextIdx);
        setIsCrossfading(false);
        setCrossfadeTo(null);
      }, CROSSFADE_MS);
    },
    [videoError]
  );

  function slotOpacity(slot: 0 | 1): number {
    if (isCrossfading && crossfadeTo !== null) {
      return slot === crossfadeTo ? 1 : 0;
    }
    return slot === activeSlot && videoReady ? 1 : 0;
  }

  // Image slideshow fallback when videos fail.
  useEffect(() => {
    if (!videoError) {
      return;
    }
    if (prefersReducedMotion) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_IMAGES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [videoError, prefersReducedMotion]);

  const overlayBg = isDark
    ? 'rgba(10, 10, 15, 0.7)'
    : 'rgba(240, 242, 250, 0.75)';

  if (prefersReducedMotion) {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${SHOWCASE_IMAGES[0]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlayBg,
            zIndex: 1,
          }}
        />
      </>
    );
  }

  return (
    <>
      {!videoError && (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster="/images/maison-blanche.webp"
            onLoadedMetadata={handleVideoPlaybackRateSync}
            onPlaying={handleVideoPlaybackRateSync}
            onCanPlayThrough={handleVideoCanPlay}
            onError={handleVideoError}
            onEnded={() => handleSlotEnded(0)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: slotOpacity(0),
              transition: `opacity ${CROSSFADE_MS}ms ease`,
            }}
          />
          <video
            ref={nextVideoRef}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleVideoPlaybackRateSync}
            onPlaying={handleVideoPlaybackRateSync}
            onError={handleVideoError}
            onEnded={() => handleSlotEnded(1)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: slotOpacity(1),
              transition: `opacity ${CROSSFADE_MS}ms ease`,
            }}
          />
        </>
      )}

      {(videoError || !videoReady) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={videoError ? `slide-${currentSlide}` : 'poster'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: videoError
                  ? `url(${SHOWCASE_IMAGES[currentSlide]})`
                  : `url(${SHOWCASE_IMAGES[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </AnimatePresence>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: overlayBg,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
