'use client';

import { formatPrice } from '@/lib/constants';
import { getAttributeLabel } from '@/lib/attribute-labels';
import { Ad, PropertyAttribute } from '@/types';
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
  const allAttributes = [
    ...new Set(items.flatMap((ad) => ad.attributes ?? [])),
  ].sort((a, b) =>
    getAttributeLabel(a).localeCompare(getAttributeLabel(b), 'fr')
  );

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
        ...allAttributes.map((attr) => ({
          label: getAttributeLabel(attr),
          render: (ad: Ad) =>
            (ad.attributes ?? []).includes(attr as PropertyAttribute) ? (
              <Check color="success" sx={{ fontSize: 18 }} />
            ) : (
              <Typography variant="caption" color="text.disabled">
                —
              </Typography>
            ),
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
