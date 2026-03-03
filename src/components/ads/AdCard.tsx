'use client';

import { formatPrice } from '@/lib/constants';
import { useFavorites } from '@/providers/FavoritesProvider';
import { Ad } from '@/types';
import {
    BathtubOutlined,
    BedOutlined,
    ChevronLeft,
    ChevronRight,
    Favorite,
    FavoriteBorder,
    SquareFootOutlined,
    Star as StarIcon,
} from '@mui/icons-material';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface AdCardProps {
  ad: Ad;
  showDistance?: boolean;
}

export default function AdCard({ ad, showDistance }: AdCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [favAnimating, setFavAnimating] = useState(false);
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();

  const isFavorite = checkFav(ad.id);

  const images = ad.images?.length > 0
    ? ad.images
    : [{ id: 0, url: '/placeholder-house.jpg', thumb: '', mime_type: 'image/jpeg', is_primary: true }];

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavAnimating(true);
    toggleFav(ad);
    setTimeout(() => setFavAnimating(false), 400);
  };

  return (
    <Box
      onClick={() => router.push(`/ads/${ad.id}/${ad.slug}`)}
      sx={{
        cursor: 'pointer',
        width: '100%',
        '&:hover .image-nav': { opacity: 1 },
        '&:hover .card-image': { transform: 'scale(1.03)' },
      }}
    >
      {/* Image carousel */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '66.67%', // 3:2 aspect ratio
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'grey.100',
        }}
      >
        {/* Images */}
        {images.map((img, idx) => (
          <Box
            key={img.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: idx === currentImage ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          >
            <Box
              component="img"
              className="card-image"
              src={img.url}
              alt={ad.title}
              loading={idx === 0 ? 'eager' : 'lazy'}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </Box>
        ))}

        {/* Gradient overlay at bottom for text readability */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Favorite button with animation */}
        <motion.div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 3,
          }}
          animate={favAnimating ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <IconButton
            onClick={handleToggleFavorite}
            sx={{
              color: isFavorite ? '#F6475F' : '#fff',
              bgcolor: isFavorite ? 'rgba(246,71,95,0.15)' : 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(4px)',
              width: 34,
              height: 34,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isFavorite ? 'rgba(246,71,95,0.25)' : 'rgba(0,0,0,0.4)',
                transform: 'scale(1.1)',
              },
            }}
            size="small"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFavorite ? 'filled' : 'outline'}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {isFavorite
                  ? <Favorite sx={{ fontSize: 18 }} />
                  : <FavoriteBorder sx={{ fontSize: 18 }} />
                }
              </motion.div>
            </AnimatePresence>
          </IconButton>
        </motion.div>

        {/* Status badge */}
        {ad.status !== 'available' && (
          <Chip
            label={ad.status === 'sold' ? 'Vendu' : ad.status === 'reserved' ? 'Réservé' : ad.status}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              zIndex: 2,
              bgcolor: ad.status === 'sold' ? 'rgba(34,34,34,0.85)' : 'rgba(246,71,95,0.85)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.7rem',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              className="image-nav"
              onClick={prevImage}
              size="small"
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.92)',
                opacity: 0,
                transition: 'opacity 0.2s, transform 0.2s',
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.05)' },
                zIndex: 2,
                width: 30,
                height: 30,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              className="image-nav"
              onClick={nextImage}
              size="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.92)',
                opacity: 0,
                transition: 'opacity 0.2s, transform 0.2s',
                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.05)' },
                zIndex: 2,
                width: 30,
                height: 30,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
              bottom: 10,
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
                sx={{
                  width: idx === currentImage ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: idx === currentImage ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Card content */}
      <Box sx={{ mt: 1.5 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.primary',
            lineHeight: 1.3,
          }}
        >
          {ad.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.quarter?.name || ad.adresse}
          {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
        </Typography>

        {/* Features row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75 }}>
          {ad.bedrooms > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <BedOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {ad.bedrooms}
              </Typography>
            </Box>
          )}
          {ad.bathrooms > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <BathtubOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {ad.bathrooms}
              </Typography>
            </Box>
          )}
          {ad.surface_area > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <SquareFootOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {ad.surface_area} m²
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bottom row: Rating + Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
          {/* Rating */}
          {ad.rating != null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 14, color: '#FFB400' }} />
              <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ lineHeight: 1 }}>
                {ad.rating.toFixed(1)}
              </Typography>
              {ad.reviews_count !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                  ({ad.reviews_count})
                </Typography>
              )}
            </Box>
          ) : <Box />}

          {/* Price */}
          <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.3px' }}>
            {formatPrice(ad.price)}
          </Typography>
        </Box>

        {showDistance && ad.distance !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            à {ad.distance < 1 ? `${Math.round(ad.distance * 1000)} m` : `${ad.distance.toFixed(1)} km`}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
