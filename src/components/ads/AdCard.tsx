'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  ChevronLeft,
  ChevronRight,
  BedOutlined,
  BathtubOutlined,
  SquareFootOutlined,
  Lock as LockIcon,
} from '@mui/icons-material';
import { Ad } from '@/types';
import { formatPrice } from '@/lib/constants';

interface AdCardProps {
  ad: Ad;
  showDistance?: boolean;
}

export default function AdCard({ ad, showDistance }: AdCardProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = ad.images.length > 0
    ? ad.images
    : [{ id: 0, url: '/placeholder-house.jpg', thumb: '', mime_type: 'image/jpeg', is_primary: true }];

  const isLocked = ad.is_unlocked === false;

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <Box
      onClick={() => router.push(`/ads/${ad.id}/${ad.slug}`)}
      sx={{
        cursor: 'pointer',
        width: '100%',
        '&:hover .image-nav': { opacity: 1 },
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
            component="img"
            src={img.url}
            alt={ad.title}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === currentImage ? 1 : 0,
              transition: 'opacity 0.3s ease',
              ...(isLocked && idx > 0 ? { filter: 'blur(20px)' } : {}),
            }}
          />
        ))}

        {/* Favorite button */}
        <IconButton
          onClick={toggleFavorite}
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

        {/* Lock badge */}
        {isLocked && (
          <Chip
            icon={<LockIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
            label="Verrouillée"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}

        {/* Status badge */}
        {ad.status !== 'available' && (
          <Chip
            label={ad.status === 'sold' ? 'Vendu' : ad.status === 'reserved' ? 'Réservé' : ad.status}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              zIndex: 2,
              bgcolor: ad.status === 'sold' ? '#222' : '#F6475F',
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
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { bgcolor: '#fff' },
                zIndex: 2,
                width: 28,
                height: 28,
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
                bgcolor: 'rgba(255,255,255,0.9)',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { bgcolor: '#fff' },
                zIndex: 2,
                width: 28,
                height: 28,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              color: 'text.primary',
            }}
          >
            {ad.quarter?.name || ad.adresse}
            {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {ad.title}
        </Typography>

        {/* Features row */}
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
        </Box>

        {/* Price + distance */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            {formatPrice(ad.price)}
          </Typography>
          {ad.type && (
            <Typography variant="caption" color="text.secondary">
              / {ad.type.name.toLowerCase()}
            </Typography>
          )}
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
