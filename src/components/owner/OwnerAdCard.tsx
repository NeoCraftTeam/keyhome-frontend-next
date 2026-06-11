'use client';

import { Price } from '@/components/ui/typography/Price';
import {
  brandAgent,
  neutral,
  semantic,
  shadow,
  transition,
} from '@/theme/tokens';
import { Ad } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BoostIcon from '@mui/icons-material/RocketLaunch';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibleIcon from '@mui/icons-material/Visibility';
import HiddenIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface OwnerAdCardProps {
  ad: Ad;
  onToggleVisibility?: (ad: Ad) => void;
  isToggling?: boolean;
  onOpenActionsMenu?: (event: React.MouseEvent<HTMLElement>, ad: Ad) => void;
}

const ICON_SCRIM_SX = {
  bgcolor: (t: Theme) =>
    alpha(t.palette.mode === 'dark' ? t.palette.grey[900] : neutral.white, 0.9),
  '&:hover': { bgcolor: 'background.paper' },
};

export default function OwnerAdCard({
  ad,
  onToggleVisibility,
  isToggling,
  onOpenActionsMenu,
}: OwnerAdCardProps) {
  const router = useRouter();
  const image = ad.images?.[0];
  const imageUrl = image?.url || image?.thumb;

  return (
    <Box
      onClick={() => router.push(`/owner/ads/${ad.id}`)}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: transition.polish,
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
        '&:hover': {
          boxShadow: shadow.ownerAdCardHover,
          transform: 'translateY(-3px)',
          borderColor: brandAgent.primaryAlpha25,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          // `aspectRatio` is unreliable as a sizing contract for the
          // `<Image fill />` child on Safari <=16 — the absolutely-positioned
          // inner Box collapses to 0 height before the image loads, causing
          // a flash. Reserve the slot with paddingTop instead, matching the
          // pattern used by AdCard and AdCardSkeleton (62.5% = 16:10).
          paddingTop: '62.5%',
          // Adapts to theme — `grey.200` was a fixed light shade that
          // stayed bright against dark `background.paper`.
          bgcolor: 'action.hover',
        }}
      >
        {imageUrl ? (
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <Image
              src={imageUrl}
              alt={ad.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 600px) 100vw, 400px"
              style={{ objectFit: 'cover' }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'grey.400',
            }}
          >
            <HomeOutlinedIcon sx={{ fontSize: 48 }} />
          </Box>
        )}
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
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 800,
                border: 'none',
                '& .MuiChip-icon': { color: 'white' },
              }}
            />
          )}
          {ad.is_verified && (
            <Tooltip title="Propriétaire vérifié">
              <VerifiedIcon
                sx={{ color: semantic.successBright, fontSize: 20, ml: 0.5 }}
              />
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
          {onOpenActionsMenu && (
            <IconButton
              size="small"
              aria-label="Plus d'actions"
              onClick={(e) => {
                e.stopPropagation();
                onOpenActionsMenu(e, ad);
              }}
              sx={{ ...ICON_SCRIM_SX }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            aria-label={
              ad.is_visible ? "Masquer l'annonce" : "Afficher l'annonce"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(ad);
            }}
            disabled={isToggling}
            sx={{ ...ICON_SCRIM_SX }}
          >
            {ad.is_visible ? (
              <VisibleIcon fontSize="small" />
            ) : (
              <HiddenIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            aria-label="Modifier l'annonce"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/owner/ads/${ad.id}`);
            }}
            sx={{ ...ICON_SCRIM_SX }}
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
              startIcon={<BoostIcon sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/owner/ads/${ad.id}?action=boost`);
              }}
              sx={{
                minWidth: 'auto',
                p: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: brandAgent.primary,
                textTransform: 'none',
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: brandAgent.primaryAlpha08,
                  '@media (prefers-reduced-motion: reduce)': {
                    transform: 'none',
                  },
                },
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
          <Typography fontWeight={700} color="primary.main" component="div">
            {ad.price != null ? <Price amountXAF={ad.price} /> : '—'}
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
