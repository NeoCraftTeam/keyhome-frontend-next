'use client';

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
 */
export default function HeroVideoBackground({ isDark }: { isDark: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  // Advance to the next video with crossfade when the current one finishes.
  const handleVideoEnded = useCallback(() => {
    const nextIdx = (currentVideo + 1) % HERO_VIDEOS.length;
    const nextVid = nextVideoRef.current;
    if (nextVid) {
      nextVid.src = HERO_VIDEOS[nextIdx];
      nextVid.load();
      nextVid.play().catch(() => {});
    }
    setIsCrossfading(true);
    setTimeout(() => {
      setCurrentVideo(nextIdx);
      setIsCrossfading(false);
    }, 1000);
  }, [currentVideo]);

  // Load video whenever currentVideo changes.
  useEffect(() => {
    if (videoError) return;
    const video = videoRef.current;
    if (!video) return;

    video.src = HERO_VIDEOS[currentVideo];
    video.load();
  }, [currentVideo, videoError]);

  // Image slideshow fallback when videos fail.
  useEffect(() => {
    if (!videoError) return;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_IMAGES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [videoError, prefersReducedMotion]);

  const overlayBg = isDark
    ? 'rgba(10, 10, 15, 0.7)'
    : 'rgba(240, 242, 250, 0.75)';

  // When reduced motion is preferred, show only a static image — no video, no slideshow.
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
      {/* Video layer — cycles through optimized hero clips with crossfade */}
      {!videoError && (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/images/maison-blanche.webp"
            onCanPlayThrough={handleVideoCanPlay}
            onError={handleVideoError}
            onEnded={handleVideoEnded}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: videoReady && !isCrossfading ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          />
          {/* Next video — preloaded and fades in during crossfade */}
          <video
            ref={nextVideoRef}
            muted
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: isCrossfading ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          />
        </>
      )}

      {/* Image slideshow fallback — shown when videos fail to load */}
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

      {/* Dark overlay for text readability over video/images */}
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
