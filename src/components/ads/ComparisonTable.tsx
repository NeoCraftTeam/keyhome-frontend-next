'use client';

import { formatPrice } from '@/lib/constants';
import { getAttributeLabel } from '@/lib/attribute-labels';
import { getComparatorAttributeSlugsForAds } from '@/lib/comparator-attributes';
import { Ad } from '@/types';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';

const CRITERIA = [
  {
    label: 'Prix / mois',
    render: (ad: Ad) => (
      <Typography fontWeight={800} fontSize={15} color="primary.main">
        {ad.price ? formatPrice(ad.price) : '—'}
      </Typography>
    ),
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
  },
  {
    label: 'Chambres',
    render: (ad: Ad) => (
      <Box display="flex" alignItems="center" gap={0.5} justifyContent="center">
        <Bed sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant="body2">{ad.bedrooms ?? '—'}</Typography>
      </Box>
    ),
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
    label: 'Transport en commun (approx.)',
    render: (ad: Ad) =>
      ad.distance_transport_m != null ? (
        <Typography variant="body2">
          {Math.round(ad.distance_transport_m).toLocaleString('fr-FR')} m
        </Typography>
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },
  {
    label: 'Commerces (approx.)',
    render: (ad: Ad) =>
      ad.distance_shops_m != null ? (
        <Typography variant="body2">
          {Math.round(ad.distance_shops_m).toLocaleString('fr-FR')} m
        </Typography>
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },
  {
    label: 'École (approx.)',
    render: (ad: Ad) =>
      ad.distance_school_m != null ? (
        <Typography variant="body2">
          {Math.round(ad.distance_school_m).toLocaleString('fr-FR')} m
        </Typography>
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
  onClear?: () => void;
  showActions?: boolean;
}

export default function ComparisonTable({
  items,
  onRemove,
  onClear: _onClear,
  showActions = true,
}: ComparisonTableProps) {
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
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
          bgcolor: 'grey.50',
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
                  bgcolor: 'grey.200',
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
        ...comparatorAttributeSlugs.map((attrSlug) => ({
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
        })),
      ].map(({ label, render }, idx) => (
        <Box
          key={label}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: `100px repeat(${items.length}, minmax(140px, 1fr))`,
              sm: `180px repeat(${items.length}, 1fr)`,
            },
            minWidth: { xs: `${100 + items.length * 140}px`, sm: 'auto' },
            bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.100',
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

          {items.map((ad) => (
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
              }}
            >
              {render(ad)}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
