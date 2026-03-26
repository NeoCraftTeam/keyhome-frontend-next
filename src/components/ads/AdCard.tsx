'use client';

import { formatPrice } from '@/lib/constants';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useComparator } from '@/providers/ComparatorProvider';
import { Ad } from '@/types';
import {
  BathtubOutlined,
  BedOutlined,
  ChevronLeft,
  ChevronRight,
  CompareArrows,
  Favorite,
  FavoriteBorder,
  SquareFootOutlined,
  Star as StarIcon,
} from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

/** Tiny inline blur placeholder — avoids layout shift while image loads */
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
  'AAGAAQDAQ/EgAIRAQMRAf/EAAGiAAAHAQEBAQEAAAAAAAAAAAQFAwIGAQAHCAkKCwEAAgIDAQEBAQEAAAAAAAAAAAECAwQFBgcICQoLEAACAQMDAgQCBgcDBAIGAnMBAgMRBAAFIRIxQVEGE2EicYEUMpGh' +
  'BxWxQiPBUtHhMxZi8CRygvElQzRTkqKyY3PCNUQnk6OzNhdUZHTD0uIIJoMJChgZhJRFRqS0VtNVKBry4/PE1OT0ZXWFlaW1xdXl9WZ2hpamtsbW5vY3R1dnd4eXp7fH1+f3OEBAQF/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAECAwQFBgf/xAAuEQACAgEEAg' +
  'IBBAMBAAAAAAABAgADBAURITETUWEiMkGBkaEGFCNxsf/aAAwDAQACEQMRAD8ApJJJJ//Z';

interface AdCardProps {
  ad: Ad;
  showDistance?: boolean;
}

/**
 * AdCard — Airbnb-inspired flat card style:
 *  - Minimal border-radius on image (8px), zero card border/shadow
 *  - Clean typography directly below image, no wrapper box
 *  - Price on its own line, features compact row above it
 */
export default function AdCard({ ad, showDistance }: AdCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const {
    add: addToComparator,
    remove: removeFromComparator,
    isSelected: isInComparator,
  } = useComparator();
  const touchStartX = useRef<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  const isFavorite = checkFav(ad.id);
  const [heartBurst, setHeartBurst] = useState(false);
  const { play } = useSoundFeedback();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFavorite) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
      play('favorite');
    } else {
      play('unfavorite');
    }
    toggleFav(ad);
  };

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

  return (
    <MotionConfig reducedMotion="user">
      <motion.a
        href={`/ads/${ad.id}/${ad.slug}`}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          router.push(`/ads/${ad.id}/${ad.slug}`);
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          cursor: 'pointer',
          width: '100%',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
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
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || images.length <= 1) return;
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 40) {
                if (delta < 0) {
                  setSlideDirection(1);
                  setCurrentImage((prev) => (prev + 1) % images.length);
                } else {
                  setSlideDirection(-1);
                  setCurrentImage(
                    (prev) => (prev - 1 + images.length) % images.length
                  );
                }
              }
              touchStartX.current = null;
            }}
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '66.67%', // 3:2 — matches Airbnb
              // Airbnb uses ~12px radius, nothing more
              borderRadius: '12px',
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
                <Image
                  src={images[currentImage].thumb || images[currentImage].url}
                  alt={`${ad.title} — photo ${currentImage + 1} sur ${images.length}`}
                  fill
                  sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
                  priority={currentImage === 0}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  style={{ objectFit: 'cover' }}
                />
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <CompareArrows sx={{ fontSize: 11 }} /> Comparé ✓
              </Box>
            )}

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
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                    color: isFavorite ? 'primary.main' : '#fff',
                    width: 32,
                    height: 32,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.35)',
                      transform: 'none',
                    },
                    '&:active': { transform: 'none' },
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
                        <Favorite sx={{ fontSize: 16 }} />
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
                        <FavoriteBorder sx={{ fontSize: 16 }} />
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
                      ? '#222'
                      : ad.status === 'reserved'
                        ? '#F59E0B'
                        : ad.status === 'rent'
                          ? '#3B82F6'
                          : 'primary.main',
                  color: '#fff',
                }}
              />
            )}

            {/* Navigation arrows — appear on hover (desktop) */}
            {images.length > 1 && (
              <>
                <IconButton
                  className="image-nav"
                  onClick={prevImage}
                  size="small"
                  aria-label="Photo précédente"
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.92)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: '#fff',
                      transform: 'translateY(-50%)',
                    },
                    '&:active': { transform: 'translateY(-50%)' },
                    '@media (hover: none)': { opacity: 0.85 },
                    zIndex: 2,
                    width: 28,
                    height: 28,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <ChevronLeft sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  className="image-nav"
                  onClick={nextImage}
                  size="small"
                  aria-label="Photo suivante"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.92)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: '#fff',
                      transform: 'translateY(-50%)',
                    },
                    '&:active': { transform: 'translateY(-50%)' },
                    '@media (hover: none)': { opacity: 0.85 },
                    zIndex: 2,
                    width: 28,
                    height: 28,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <ChevronRight sx={{ fontSize: 18 }} />
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
                    role="button"
                    tabIndex={-1}
                    aria-label={`Photo ${idx + 1}`}
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
                          ? '#fff'
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
                    <StarIcon sx={{ fontSize: 12, color: '#222' }} />
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ fontSize: '0.75rem', lineHeight: 1 }}
                    >
                      {ad.rating.toFixed(1)}
                    </Typography>
                  </Box>
                )}
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
                variant="body2"
                fontWeight={700}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.82rem', sm: '0.875rem' },
                }}
              >
                {formatPrice(ad.price)}
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
                  style={{ display: 'flex' }}
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
