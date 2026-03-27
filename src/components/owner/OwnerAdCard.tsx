'use client';

import { formatPrice } from '@/lib/constants';
import { Ad } from '@/types';
import {
  Edit as EditIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
  RocketLaunch as BoostIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Tooltip,
  Button,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { brand } from '@/theme/tokens';

interface OwnerAdCardProps {
  ad: Ad;
  onToggleVisibility?: (ad: Ad) => void;
  isToggling?: boolean;
}

export default function OwnerAdCard({
  ad,
  onToggleVisibility,
  isToggling,
}: OwnerAdCardProps) {
  const router = useRouter();
  const image = ad.images?.[0];
  const imageUrl = image?.url || image?.thumb || '/images/placeholder-ad.jpg';

  return (
    <Box
      onClick={() => router.push(`/owner/ads/${ad.id}`)}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' },
      }}
    >
      <Box
        sx={{ position: 'relative', aspectRatio: '16/10', bgcolor: 'grey.200' }}
      >
        <Image
          src={imageUrl}
          alt={ad.title}
          fill
          sizes="(max-width: 600px) 100vw, 400px"
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Chip
            label={ad.status_label || ad.status}
            size="small"
            color={
              ad.status === 'available'
                ? 'success'
                : ad.status === 'pending'
                  ? 'warning'
                  : 'default'
            }
            sx={{ fontWeight: 600 }}
          />
          {ad.is_visible === false && (
            <Chip label="Masqué" size="small" color="secondary" />
          )}
          {ad.is_boosted && (
            <Chip
              icon={<BoostIcon sx={{ fontSize: '14px !important' }} />}
              label="Boosté"
              size="small"
              sx={{
                bgcolor: brand.primary,
                color: 'white',
                fontWeight: 800,
                '& .MuiChip-icon': { color: 'white' },
              }}
            />
          )}
          {ad.is_verified && (
            <Tooltip title="Propriétaire vérifié">
              <VerifiedIcon sx={{ color: '#10B981', fontSize: 20, ml: 0.5 }} />
            </Tooltip>
          )}
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(ad);
            }}
            disabled={isToggling}
            sx={{
              bgcolor: (t) =>
                t.palette.mode === 'dark'
                  ? 'rgba(19,19,26,0.9)'
                  : 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            {ad.is_visible ? (
              <VisibleIcon fontSize="small" />
            ) : (
              <HiddenIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/owner/ads/${ad.id}`);
            }}
            sx={{
              bgcolor: (t) =>
                t.palette.mode === 'dark'
                  ? 'rgba(19,19,26,0.9)'
                  : 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.5,
          }}
        >
          <Typography fontWeight={700} noWrap sx={{ flex: 1 }}>
            {ad.title}
          </Typography>
          {!ad.is_boosted && (
            <Button
              size="small"
              variant="text"
              startIcon={<BoostIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/owner/ads/${ad.id}?action=boost`);
              }}
              sx={{
                minWidth: 'auto',
                p: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: brand.primary,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(246, 71, 95, 0.08)' },
              }}
            >
              Booster
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {ad.quarter?.city_name || ''} · {ad.surface_area} m² · {ad.bedrooms}{' '}
          ch.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography fontWeight={700} color="primary.main">
            {ad.price != null ? formatPrice(ad.price) : '—'}
          </Typography>
          {ad.reviews_count != null && ad.reviews_count > 0 && (
            <Typography variant="caption" color="text.secondary">
              · {ad.reviews_count} avis
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
