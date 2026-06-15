'use client';

import { Price } from '@/components/ui/typography/Price';
import { getAttributeLabel } from '@/lib/attribute-labels';
import { getComparatorAttributeSlugsForAds } from '@/lib/comparator-attributes';
import { Ad } from '@/types';
import Bathtub from '@mui/icons-material/Bathtub';
import Bed from '@mui/icons-material/Bed';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import OpenInNew from '@mui/icons-material/OpenInNew';
import SquareFoot from '@mui/icons-material/SquareFoot';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Criterion {
  label: string;
  render: (ad: Ad) => React.ReactNode;
  bestAdId?: (ads: Ad[]) => string | null;
  /** Semantic highlight key — resolved to a theme-aware colour at render time. */
  highlight?: 'success' | 'primary';
}

const CRITERIA: Criterion[] = [
  {
    label: 'Prix / mois',
    render: (ad: Ad) => (
      <Typography
        fontWeight={800}
        fontSize={15}
        color="primary.main"
        component="div"
      >
        {ad.price ? <Price amountXAF={ad.price} /> : '—'}
      </Typography>
    ),
    bestAdId: (ads) => {
      const valid = ads.filter((a) => a.price != null);
      if (!valid.length) return null;
      return valid.reduce((best, a) => (a.price! < best.price! ? a : best)).id;
    },
    highlight: 'success',
  },
  {
    label: 'Transaction',
    render: (ad: Ad) => (
      <Typography variant="body2" fontWeight={600}>
        {ad.transaction_type === 'vente'
          ? 'Vente'
          : ad.transaction_type === 'location'
            ? 'Location'
            : '—'}
      </Typography>
    ),
  },
  {
    label: 'Surface',
    render: (ad: Ad) => (
      <Box display="flex" alignItems="center" gap={0.5} justifyContent="center">
        <SquareFoot sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant="body2">
          {ad.surface_area ? `${ad.surface_area} m²` : '—'}
        </Typography>
      </Box>
    ),
    bestAdId: (ads) => {
      const valid = ads.filter((a) => a.surface_area != null);
      if (!valid.length) return null;
      return valid.reduce((best, a) =>
        a.surface_area! > best.surface_area! ? a : best
      ).id;
    },
    highlight: 'primary',
  },
  {
    label: 'Chambres',
    render: (ad: Ad) => (
      <Box display="flex" alignItems="center" gap={0.5} justifyContent="center">
        <Bed sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant="body2">{ad.bedrooms ?? '—'}</Typography>
      </Box>
    ),
    bestAdId: (ads) => {
      const valid = ads.filter((a) => a.bedrooms != null);
      if (!valid.length) return null;
      return valid.reduce((best, a) =>
        a.bedrooms! > best.bedrooms! ? a : best
      ).id;
    },
    highlight: 'primary',
  },
  {
    label: 'Salles de bain',
    render: (ad: Ad) => (
      <Box display="flex" alignItems="center" gap={0.5} justifyContent="center">
        <Bathtub sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant="body2">{ad.bathrooms ?? '—'}</Typography>
      </Box>
    ),
  },
  {
    label: 'Parking',
    render: (ad: Ad) =>
      ad.has_parking ? (
        <Chip label="Oui" size="small" color="success" variant="outlined" />
      ) : (
        <Chip label="Non" size="small" color="default" variant="outlined" />
      ),
  },
  {
    label: 'Prix / m²',
    render: (ad: Ad) => (
      <Typography variant="body2" fontWeight={600}>
        {ad.price && ad.surface_area
          ? `${Math.round(ad.price / ad.surface_area).toLocaleString('fr-FR')} FCFA/m²`
          : '—'}
      </Typography>
    ),
    bestAdId: (ads) => {
      const valid = ads.filter(
        (a) => a.price != null && a.surface_area != null
      );
      if (!valid.length) return null;
      return valid.reduce((best, a) =>
        a.price! / a.surface_area! < best.price! / best.surface_area! ? a : best
      ).id;
    },
    highlight: 'success',
  },
  {
    label: 'Disponible à partir du',
    render: (ad: Ad) => {
      if (!ad.available_from) {
        return (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        );
      }
      const d = parseISO(ad.available_from);
      if (!isValid(d)) {
        return (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        );
      }
      return (
        <Typography variant="body2">
          {format(d, 'd MMM yyyy', { locale: fr })}
        </Typography>
      );
    },
  },
  {
    label: 'Durée minimale du bail',
    render: (ad: Ad) =>
      ad.minimum_lease_duration ? (
        <Typography variant="body2">{ad.minimum_lease_duration}</Typography>
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },
  {
    label: 'Visite 360°',
    render: (ad: Ad) =>
      ad.has_3d_tour ? (
        <Chip
          label="Disponible"
          size="small"
          color="success"
          variant="outlined"
        />
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },
];

interface ComparisonTableProps {
  items: Ad[];
  onRemove: (id: string) => void;
  showActions?: boolean;
}

export default function ComparisonTable({
  items,
  onRemove,
  showActions = true,
}: ComparisonTableProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const comparatorAttributeSlugs = getComparatorAttributeSlugsForAds(items);

  const handleViewAd = (ad: Ad) => {
    router.push(`/ads/${ad.slug}`);
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: `100px repeat(${items.length}, minmax(140px, 1fr))`,
            sm: `180px repeat(${items.length}, 1fr)`,
          },
          gap: 0,
          borderBottom: '2px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'grey.900' : 'grey.50',
          minWidth: { xs: `${100 + items.length * 140}px`, sm: 'auto' },
        }}
      >
        <Box sx={{ p: { xs: 1, sm: 2 } }} />

        {items.map((ad) => {
          const cover = ad.images?.find((i) => i.is_primary) ?? ad.images?.[0];
          return (
            <Box
              key={ad.id}
              sx={{
                p: { xs: 1, sm: 2 },
                borderLeft: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                  position: 'relative',
                }}
              >
                {cover && (
                  <Box
                    component="img"
                    src={cover.thumb ?? cover.url}
                    alt={ad.title}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {showActions && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(ad.id)}
                    aria-label={`Retirer ${ad.title} de la comparaison`}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      width: 22,
                      height: 22,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                    }}
                  >
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ lineHeight: 1.3 }}
                >
                  {ad.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ad.quarter?.name}
                  {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                onClick={() => handleViewAd(ad)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  fontSize: 12,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.50' },
                }}
              >
                Voir l&apos;annonce
              </Button>
            </Box>
          );
        })}
      </Box>

      {[
        ...CRITERIA,
        ...(comparatorAttributeSlugs.map((attrSlug) => ({
          label: getAttributeLabel(attrSlug),
          render: (ad: Ad) => {
            const attrs = (ad.attributes ?? []).map((a) => a.toLowerCase());
            const hit = attrs.includes(attrSlug.toLowerCase());
            return hit ? (
              <Check color="success" sx={{ fontSize: 18 }} />
            ) : (
              <Typography variant="caption" color="text.disabled">
                —
              </Typography>
            );
          },
        })) as Criterion[]),
      ].map(({ label, render, bestAdId, highlight }, idx) => {
        const bestId = bestAdId ? bestAdId(items) : null;
        return (
          <Box
            key={label}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: `100px repeat(${items.length}, minmax(140px, 1fr))`,
                sm: `180px repeat(${items.length}, 1fr)`,
              },
              minWidth: { xs: `${100 + items.length * 140}px`, sm: 'auto' },
              bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box
              sx={{
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1.25, sm: 1.75 },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
                fontSize={{ xs: 11, sm: 13 }}
              >
                {label}
              </Typography>
            </Box>

            {items.map((ad) => {
              const isHighlighted = bestId !== null && ad.id === bestId;
              return (
                <Box
                  key={ad.id}
                  sx={{
                    px: { xs: 1, sm: 2 },
                    py: { xs: 1.25, sm: 1.75 },
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    bgcolor:
                      isHighlighted && highlight
                        ? alpha(
                            highlight === 'success'
                              ? theme.palette.success.main
                              : theme.palette.primary.main,
                            isDark ? 0.28 : 0.12
                          )
                        : undefined,
                    borderRadius: isHighlighted ? 0.5 : 0,
                    position: 'relative',
                  }}
                >
                  {render(ad)}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
