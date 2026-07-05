'use client';

import { SponsorshipBadge } from '@/components/ads/SponsorshipBadge';
import { Price } from '@/components/ui/typography/Price';
import { Typography } from '@/components/ui/typography/Typography';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { useComparator } from '@/providers/ComparatorProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { neutral, semantic, shadow } from '@/theme/tokens';
import { Ad } from '@/types';
import BathtubOutlined from '@mui/icons-material/BathtubOutlined';
import BedOutlined from '@mui/icons-material/BedOutlined';
import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CompareArrows from '@mui/icons-material/CompareArrows';
import SquareFootOutlined from '@mui/icons-material/SquareFootOutlined';
import StarIcon from '@mui/icons-material/Star';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hover variants — propagated from the root motion.a to children:
 * - root anchor: subtle translateY lift (no box shadow — see note)
 * - image itself: gentle scale zoom
 *
 * The Airbnb-flat aesthetic this card targets requires NO shadow on the
 * root anchor at rest. A shadow on the unrounded <a> renders as a square
 * halo around the rounded image + flat text below, which looks broken
 * on grid views. The hover state communicates affordance through the
 * translateY lift + image zoom instead.
 */
const CARD_VARIANTS = {
  rest: { y: 0 },
  hover: { y: -4 },
};

const IMAGE_VARIANTS = {
  rest: { scale: 1 },
  hover: { scale: 1.04 },
};

/** Returns the color for a KeyScore value (0-100) */
function keyScoreColor(score: number): string {
  if (score >= 75) return '#0D9488'; // vert
  if (score >= 50) return '#D97706'; // orange
  return '#EF4444'; // rouge
}

/** Compact inline badge: colored ring + score number */
function KeyScoreBadge({ score }: { score: number }) {
  const color = keyScoreColor(score);
  const radius = 7;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <Box
      component="span"
      title={`KeyScore : ${score}/100`}
      aria-label={`KeyScore ${score} sur 100`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.3,
        flexShrink: 0,
        cursor: 'default',
      }}
    >
      <svg width={18} height={18} viewBox="0 0 18 18">
        <circle
          cx={9}
          cy={9}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          style={{ color: '#E5E7EB' }}
        />
        <circle
          cx={9}
          cy={9}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 9 9)"
        />
      </svg>
      <Typography
        component="span"
        sx={{ fontSize: '0.68rem', fontWeight: 700, color, lineHeight: 1 }}
      >
        {score}
      </Typography>
    </Box>
  );
}

/** Tiny inline blur placeholder — avoids layout shift while image loads */
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
  'AAGAAQDAQ/EgAIRAQMRAf/EAAGiAAAHAQEBAQEAAAAAAAAAAAQFAwIGAQAHCAkKCwEAAgIDAQEBAQEAAAAAAAAAAAECAwQFBgcICQoLEAACAQMDAgQCBgcDBAIGAnMBAgMRBAAFIRIxQVEGE2EicYEUMpGh' +
  'BxWxQiPBUtHhMxZi8CRygvElQzRTkqKyY3PCNUQnk6OzNhdUZHTD0uIIJoMJChgZhJRFRqS0VtNVKBry4/PE1OT0ZXWFlaW1xdXl9WZ2hpamtsbW5vY3R1dnd4eXp7fH1+f3OEBAQF/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAECAwQFBgf/xAAuEQACAgEEAg' +
  'IBBAMBAAAAAAABAgADBAURITETUWEiMkGBkaEGFCNxsf/aAAwDAQACEQMRAD8ApJJJJ//Z';

interface AdCardProps {
  ad: Ad;
  showDistance?: boolean;
  /** Override Next.js Image `sizes` — use `"220px"` in horizontal carousels (gap #5 audit). */
  imageSizes?: string;
}

/**
 * AdCard — Airbnb-inspired flat card style:
 *  - Minimal border-radius on image (8px), zero card border/shadow
 *  - Clean typography directly below image, no wrapper box
 *  - Price on its own line, features compact row above it
 */
function AdCard({ ad, showDistance, imageSizes }: AdCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const {
    add: addToComparator,
    remove: removeFromComparator,
    isSelected: isInComparator,
  } = useComparator();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  const isFavorite = checkFav(ad.id);
  const [heartBurst, setHeartBurst] = useState(false);
  const { play } = useSoundFeedback();

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isFavorite) {
        setHeartBurst(true);
        play('favorite');
      } else {
        play('unfavorite');
      }
      toggleFav(ad);
    },
    [isFavorite, play, toggleFav, ad]
  );

  // Clean up heartBurst animation timeout
  useEffect(() => {
    if (!heartBurst) return;
    const timer = setTimeout(() => setHeartBurst(false), 600);
    return () => clearTimeout(timer);
  }, [heartBurst]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(`/ads/${ad.slug}`);
    },
    [router, ad.slug]
  );

  const images =
    ad.images?.length > 0
      ? ad.images
      : [
          {
            id: 0,
            url: '/placeholder-house.jpg',
            thumb: '',
            mime_type: 'image/jpeg',
            is_primary: true,
          },
        ];

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideDirection(1);
      setCurrentImage((prev) => (prev + 1) % images.length);
    },
    [images.length]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideDirection(-1);
      setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    },
    [images.length]
  );

  // Warm Next.js router cache for the ad detail page on intent (hover/touch).
  // Combined with the new `loading.tsx` skeleton this makes the navigation
  // feel instant — the user sees the skeleton on tap, and the real page
  // streams in over an already-warm chunk.
  const prefetchedRef = useRef(false);
  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    try {
      router.prefetch(`/ads/${ad.slug}`);
    } catch {
      /* prefetch is best-effort — ignore failures (e.g. dev mode) */
    }
  }, [router, ad.slug]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.a
        href={`/ads/${ad.slug}`}
        onClick={handleCardClick}
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
        variants={CARD_VARIANTS}
        initial="rest"
        whileHover="hover"
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          cursor: 'pointer',
          width: '100%',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          // Override framer-motion's internal `touch-action: none` that the
          // press/whileTap gesture handler sets automatically. Without this,
          // Android Chrome cannot detect vertical/horizontal pan gestures and
          // the page (or a horizontal scroll container) becomes un-scrollable
          // when the user starts a touch on a card.
          touchAction: 'pan-x pan-y',
        }}
        role="link"
        aria-label={ad.title}
      >
        <Box
          sx={{
            '&:hover .image-nav': { opacity: 1 },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 4,
              borderRadius: 1,
            },
          }}
        >
          {/* ── Image area ─────────────────────────────────────────────── */}
          <Box
            tabIndex={images.length > 1 ? 0 : undefined}
            role={images.length > 1 ? 'region' : undefined}
            aria-roledescription={images.length > 1 ? 'carrousel' : undefined}
            aria-label={
              images.length > 1
                ? `${images.length} photos de ${ad.title}`
                : undefined
            }
            onKeyDown={(e) => {
              if (images.length <= 1) return;
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                setSlideDirection(1);
                setCurrentImage((prev) => (prev + 1) % images.length);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                setSlideDirection(-1);
                setCurrentImage(
                  (prev) => (prev - 1 + images.length) % images.length
                );
              }
            }}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || images.length <= 1) return;
              const deltaX = e.changedTouches[0].clientX - touchStartX.current;
              const deltaY =
                e.changedTouches[0].clientY - (touchStartY.current ?? 0);
              touchStartX.current = null;
              touchStartY.current = null;
              // Only treat as horizontal image swipe when the gesture is
              // predominantly horizontal — prevents triggering during diagonal
              // scrolls, which is the main cause of missed vertical scrolls.
              if (
                Math.abs(deltaX) > 40 &&
                Math.abs(deltaX) > Math.abs(deltaY)
              ) {
                if (deltaX < 0) {
                  setSlideDirection(1);
                  setCurrentImage((prev) => (prev + 1) % images.length);
                } else {
                  setSlideDirection(-1);
                  setCurrentImage(
                    (prev) => (prev - 1 + images.length) % images.length
                  );
                }
              }
            }}
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '100%', // 1:1 — vignette carrée façon Airbnb
              borderRadius: '16px', // coins bien arrondis
              overflow: 'hidden',
              bgcolor: 'grey.100',
            }}
          >
            {/* Images — slide transition */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentImage}
                initial={{
                  opacity: 0,
                  x: slideDirection * 24,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{
                  opacity: 0,
                  x: -slideDirection * 24,
                  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <motion.div
                  variants={IMAGE_VARIANTS}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Image
                    src={images[currentImage].thumb || images[currentImage].url}
                    alt={`${ad.title} — photo ${currentImage + 1} sur ${images.length}`}
                    fill
                    sizes={
                      imageSizes ??
                      '(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw'
                    }
                    priority={currentImage === 0}
                    fetchPriority={currentImage === 0 ? 'high' : 'auto'}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    style={{ objectFit: 'cover' }}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Compare badge — top left */}
            {isInComparator(ad.id) && (
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFromComparator(ad.id);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 2,
                  px: 1,
                  py: 0.25,
                  borderRadius: 99,
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  boxShadow: shadow.medium,
                }}
              >
                <CompareArrows sx={{ fontSize: 11 }} /> Comparé ✓
              </Box>
            )}

            {/* Sponsorship pill — Premium / Subscription / Manual tier.
                Organic ads render no badge. Slides below the Compare badge
                when the listing is in the comparator. */}
            <SponsorshipBadge
              tier={ad.sponsorship_tier}
              fallbackBoosted={ad.is_boosted}
              top={isInComparator(ad.id) ? 36 : 8}
            />

            {/* Heart button with burst animation */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
              <motion.div
                animate={
                  heartBurst ? { scale: [1, 1.5, 0.85, 1.15, 1] } : { scale: 1 }
                }
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <IconButton
                  onClick={handleToggleFavorite}
                  aria-label={
                    isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
                  }
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                    color: isFavorite ? 'primary.main' : neutral.white,
                    width: 44,
                    height: 44,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.35)',
                      transform: 'none',
                    },
                    '&:active': {
                      bgcolor: 'rgba(255,255,255,0.4)',
                      transform: 'none',
                    },
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isFavorite ? (
                      <motion.span
                        key="filled"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex' }}
                      >
                        <Bookmark sx={{ fontSize: 16 }} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="outlined"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex' }}
                      >
                        <BookmarkBorder sx={{ fontSize: 16 }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </IconButton>
              </motion.div>
            </Box>

            {/* Status badge — bottom-left */}
            {ad.status !== 'available' && (
              <Chip
                label={
                  ad.status === 'sold'
                    ? 'Vendu'
                    : ad.status === 'reserved'
                      ? 'Réservé'
                      : ad.status === 'rent'
                        ? 'En location'
                        : (ad.status_label ?? ad.status)
                }
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  zIndex: 2,
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor:
                    ad.status === 'sold'
                      ? neutral.black
                      : ad.status === 'reserved'
                        ? semantic.warning
                        : ad.status === 'rent'
                          ? semantic.info
                          : 'primary.main',
                  color: neutral.white,
                }}
              />
            )}

            {/* Navigation arrows — appear on hover (desktop) */}
            {images.length > 1 && (
              <>
                <IconButton
                  className="image-nav"
                  onClick={prevImage}
                  aria-label="Photo précédente"
                  sx={{
                    position: 'absolute',
                    left: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: { xs: 0.7, md: 0 },
                    bgcolor: 'rgba(255,255,255,0.88)',
                    color: 'rgba(0,0,0,0.75)',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: neutral.white,
                      color: 'rgba(0,0,0,0.87)',
                      transform: 'translateY(-50%)',
                    },
                    '&:active': {
                      bgcolor: neutral.white,
                      transform: 'translateY(-50%) scale(0.9)',
                    },
                    zIndex: 2,
                    width: 36,
                    height: 36,
                    boxShadow: shadow.cardSm,
                  }}
                >
                  <ChevronLeft sx={{ fontSize: 20 }} />
                </IconButton>

                <IconButton
                  className="image-nav"
                  onClick={nextImage}
                  aria-label="Photo suivante"
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: { xs: 0.7, md: 0 },
                    bgcolor: 'rgba(255,255,255,0.88)',
                    color: 'rgba(0,0,0,0.75)',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: neutral.white,
                      color: 'rgba(0,0,0,0.87)',
                      transform: 'translateY(-50%)',
                    },
                    '&:active': {
                      bgcolor: neutral.white,
                      transform: 'translateY(-50%) scale(0.9)',
                    },
                    zIndex: 2,
                    width: 36,
                    height: 36,
                    boxShadow: shadow.cardSm,
                  }}
                >
                  <ChevronRight sx={{ fontSize: 20 }} />
                </IconButton>
              </>
            )}

            {/* Dots indicator */}
            {images.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 0.5,
                  zIndex: 2,
                }}
              >
                {images.slice(0, 5).map((_, idx) => (
                  <Box
                    key={idx}
                    // Dots are purely visual position indicators nested
                    // inside the card's outer <motion.a>. Exposing them
                    // as additional interactive controls would create a
                    // nested-interactive-content violation. Keyboard +
                    // SR users get the same information via the image's
                    // alt text (already includes "photo N sur M") and
                    // navigate the card link itself.
                    aria-hidden="true"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSlideDirection(idx > currentImage ? 1 : -1);
                      setCurrentImage(idx);
                    }}
                    sx={{
                      width: 8, // WCAG 2.5.5: Increased from 5px for better touch target
                      height: 8,
                      borderRadius: '50%',
                      bgcolor:
                        idx === currentImage
                          ? neutral.white
                          : 'rgba(255,255,255,0.45)',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      position: 'relative',
                      // Invisible hitbox to meet 44x44px minimum touch target
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* ── Text content — Airbnb style ────────────────────────────── */}
          <Box sx={{ pt: 1.25, pb: 0.5 }}>
            {/* Title + Rating + KeyScore — same row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                  flex: 1,
                  minWidth: 0,
                  fontSize: { xs: '0.82rem', sm: '0.875rem' },
                }}
              >
                {ad.title}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                {ad.rating != null && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      flexShrink: 0,
                    }}
                  >
                    <StarIcon sx={{ fontSize: 12, color: 'text.primary' }} />
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ fontSize: '0.75rem', lineHeight: 1 }}
                    >
                      {ad.rating.toFixed(1)}
                    </Typography>
                  </Box>
                )}
                {ad.keyscore != null && <KeyScoreBadge score={ad.keyscore} />}
              </Box>
            </Box>

            {/* Location */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mt: 0.15,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
              }}
            >
              {ad.quarter?.name || ad.adresse}
              {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
            </Typography>

            {/* Features — compact row */}
            {(ad.bedrooms > 0 || ad.bathrooms > 0 || ad.surface_area > 0) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.4,
                  flexWrap: 'wrap',
                }}
              >
                {ad.bedrooms > 0 && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}
                  >
                    <BedOutlined
                      sx={{ fontSize: 13, color: 'text.secondary' }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.72rem' }}
                    >
                      {ad.bedrooms}
                    </Typography>
                  </Box>
                )}
                {ad.bathrooms > 0 && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}
                  >
                    <BathtubOutlined
                      sx={{ fontSize: 13, color: 'text.secondary' }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.72rem' }}
                    >
                      {ad.bathrooms}
                    </Typography>
                  </Box>
                )}
                {ad.surface_area > 0 && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}
                  >
                    <SquareFootOutlined
                      sx={{ fontSize: 13, color: 'text.secondary' }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.72rem' }}
                    >
                      {ad.surface_area} m²
                    </Typography>
                  </Box>
                )}
                {showDistance && ad.distance !== undefined && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.72rem' }}
                  >
                    ·{' '}
                    {ad.distance < 1
                      ? `${Math.round(ad.distance * 1000)} m`
                      : `${ad.distance.toFixed(1)} km`}
                  </Typography>
                )}
              </Box>
            )}

            {/* Price + Compare — same row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 0.5,
                gap: 0.5,
              }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0.25,
                }}
              >
                {ad.price != null ? (
                  <Price amountXAF={ad.price} compact />
                ) : (
                  '—'
                )}
                {ad.price != null && ad.transaction_type === 'location' && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    /{ad.price_period === 'jour' ? 'j' : 'mois'}
                  </Typography>
                )}
              </Typography>
              <Tooltip
                title={
                  isInComparator(ad.id)
                    ? 'Retirer de la comparaison'
                    : 'Comparer ce bien'
                }
              >
                <motion.div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isInComparator(ad.id)) {
                      removeFromComparator(ad.id);
                    } else {
                      addToComparator(ad);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ display: 'flex', touchAction: 'pan-x pan-y' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      px: 0.75,
                      py: 0.5, // WCAG 2.5.5: Increased py from 0.25 for better touch target
                      minHeight: 44, // WCAG 2.5.5: Minimum touch target height
                      minWidth: 44, // WCAG 2.5.5: Minimum touch target width
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isInComparator(ad.id)
                        ? 'primary.main'
                        : 'divider',
                      color: isInComparator(ad.id)
                        ? 'primary.main'
                        : 'text.disabled',
                      fontSize: 10,
                      fontWeight: 600,
                      flexShrink: 0,
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <CompareArrows sx={{ fontSize: 11 }} />
                    {isInComparator(ad.id) ? '✓' : '+'}
                  </Box>
                </motion.div>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </motion.a>
    </MotionConfig>
  );
}

export default memo(
  AdCard,
  (prev, next) =>
    prev.ad.id === next.ad.id &&
    prev.ad.updated_at === next.ad.updated_at &&
    prev.showDistance === next.showDistance &&
    prev.imageSizes === next.imageSizes
);
