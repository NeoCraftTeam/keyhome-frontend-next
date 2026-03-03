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
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

interface AdCardProps {
  ad: Ad;
  showDistance?: boolean;
}

export default function AdCard({ ad, showDistance }: AdCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const touchStartX = useRef<number | null>(null);

  const isFavorite = checkFav(ad.id);

  const images = ad.images?.length > 0
    ? ad.images
    : [{ id: 0, url: '/placeholder-house.jpg', thumb: '', mime_type: 'image/jpeg', is_primary: true }];

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(ad);
  };

  return (
    <Box
      component="a"
      href={`/ads/${ad.id}/${ad.slug}`}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        router.push(`/ads/${ad.id}/${ad.slug}`);
      }}
      sx={{
        cursor: 'pointer',
        width: '100%',
        textDecoration: 'none',
        color: 'text.primary',
        display: 'block',
        '&:hover .image-nav': { opacity: 1 },
        '&:focus-visible': {
          outline: '2px solid #F6475F',
          outlineOffset: 4,
          borderRadius: 3,
        },
      }}
    >
      {/* Image carousel */}
      <Box
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || images.length <= 1) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(delta) > 40) {
            if (delta < 0) setCurrentImage((prev) => (prev + 1) % images.length);
            else setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
          }
          touchStartX.current = null;
        }}
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
              transition: 'opacity 0.3s ease',
            }}
          >
            <Image
              src={img.url}
              alt={`${ad.title}${idx > 0 ? ` ${idx + 1}` : ''}`}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
              priority={idx === 0}
              style={{ objectFit: 'cover' }}
            />
          </Box>
        ))}

        {/* Favorite button */}
        <IconButton
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            color: isFavorite ? '#F6475F' : '#fff',
            filter: isFavorite ? 'none' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
          }}
          size="small"
        >
          {isFavorite ? <Favorite /> : <FavoriteBorder />}
        </IconButton>

        {/* Status badge */}
        {ad.status !== 'available' && (
          <Chip
            label={
              ad.status === 'sold'
                ? 'Vendu'
                : ad.status === 'reserved'
                  ? 'Réservé'
                  : ad.status === 'rent'
                    ? 'En location'
                    : ad.status_label ?? ad.status
            }
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              zIndex: 2,
              bgcolor:
                ad.status === 'sold'
                  ? '#222'
                  : ad.status === 'reserved'
                    ? '#F59E0B'
                    : ad.status === 'rent'
                      ? '#3B82F6'
                      : '#F6475F',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.7rem',
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
              aria-label="Photo précédente"
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { bgcolor: '#fff' },
                '@media (hover: none)': { opacity: 0.85 },
                zIndex: 2,
                width: { xs: 36, sm: 28 },
                height: { xs: 36, sm: 28 },
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
                bgcolor: 'rgba(255,255,255,0.9)',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { bgcolor: '#fff' },
                '@media (hover: none)': { opacity: 0.85 },
                zIndex: 2,
                width: { xs: 36, sm: 28 },
                height: { xs: 36, sm: 28 },
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
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: idx === currentImage ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Card content */}
      <Box sx={{ mt: 1.5 }}>
        {/* Title + Rating row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="text.primary"
            className="ad-card-title"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              minWidth: 0,
            }}
          >
            {ad.title}
          </Typography>
          {ad.rating != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
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
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.quarter?.name || ad.adresse}
          {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
        </Typography>

        {/* Features + Price row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
          {ad.bedrooms > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <BedOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {ad.bedrooms}
              </Typography>
            </Box>
          )}
          {ad.bathrooms > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <BathtubOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {ad.bathrooms}
              </Typography>
            </Box>
          )}
          {ad.surface_area > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <SquareFootOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {ad.surface_area} m²
              </Typography>
            </Box>
          )}

          {/* Price */}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.primary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {formatPrice(ad.price)}
          </Typography>
        </Box>

        {showDistance && ad.distance !== undefined && (
          <Typography variant="caption" color="text.secondary">
            à {ad.distance < 1 ? `${Math.round(ad.distance * 1000)} m` : `${ad.distance.toFixed(1)} km`}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
