'use client';

import { useComparator } from '@/providers/ComparatorProvider';
import { formatPrice } from '@/lib/constants';
import { Ad, PropertyAttribute } from '@/types';
import {
  Bathtub,
  Bed,
  Check,
  Close,
  CompareArrows,
  DirectionsCar,
  OpenInNew,
  SquareFoot,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ATTRIBUTE_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  air_conditioning: 'Climatisation',
  furnished: 'Meublé',
  pool: 'Piscine',
  garden: 'Jardin',
  balcony: 'Balcon',
  elevator: 'Ascenseur',
  security: 'Sécurité',
  gym: 'Salle de sport',
};

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
        <Typography variant="body2">{ad.surface_area ? `${ad.surface_area} m²` : '—'}</Typography>
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
    render: (ad: Ad) => ad.has_parking
      ? <Chip label="Oui" size="small" color="success" variant="outlined" />
      : <Chip label="Non" size="small" color="default" variant="outlined" />,
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
    render: (ad: Ad) => ad.has_3d_tour
      ? <Chip label="Disponible" size="small" color="success" variant="outlined" />
      : <Typography variant="caption" color="text.disabled">—</Typography>,
  },
];

export default function ComparatorBar() {
  const { items, remove, clear, isOpen, setOpen, maxReached, clearMaxReached } = useComparator();
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);

  const allAttributes = [...new Set(items.flatMap((ad) => ad.attributes ?? []))];

  const handleViewAd = (ad: Ad) => {
    setOpen(false);
    setMinimized(true);
    router.push(`/ads/${ad.id}/${ad.slug}`);
  };

  const handleOpenComparator = () => {
    setMinimized(false);
    setOpen(true);
  };

  if (items.length === 0) { return null; }

  return (
    <>
      {/* Floating bar — always visible when items selected */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1200,
              pointerEvents: 'none',
            }}
          >
            <Box sx={{ pointerEvents: 'auto' }}>
            <Paper
              elevation={12}
              sx={{
                px: 2.5,
                py: 1.25,
                borderRadius: 99,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: '0 8px 32px rgba(246,71,95,0.18)',
              }}
            >
              <CompareArrows color="primary" sx={{ fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={13}>
                {items.length} bien{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
              </Typography>

              {/* Avatars */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {items.map((ad) => (
                  <Tooltip key={ad.id} title={`Retirer : ${ad.title}`}>
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => remove(ad.id)}>
                      <Avatar
                        src={ad.images?.[0]?.thumb}
                        sx={{ width: 30, height: 30, border: '2px solid white' }}
                      >
                        {ad.title[0]}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute', top: -3, right: -3,
                          width: 13, height: 13, borderRadius: '50%',
                          bgcolor: 'error.main', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Close sx={{ fontSize: 9, color: 'white' }} />
                      </Box>
                    </Box>
                  </Tooltip>
                ))}
              </Box>

              <Button
                variant="contained"
                size="small"
                onClick={handleOpenComparator}
                disabled={items.length < 2}
                sx={{
                  borderRadius: 99,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                  '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                }}
              >
                Comparer
              </Button>

              <IconButton size="small" onClick={clear} sx={{ color: 'text.disabled' }}>
                <Close fontSize="small" />
              </IconButton>
            </Paper>
              </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max reached snackbar */}
      <Snackbar
        open={maxReached}
        autoHideDuration={3000}
        onClose={clearMaxReached}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={clearMaxReached} severity="warning" variant="filled" sx={{ width: '100%' }}>
          Vous ne pouvez pas comparer plus de 3 biens à la fois.
        </Alert>
      </Snackbar>

      {/* Comparison Dialog — full redesign */}
      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CompareArrows color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Comparaison de biens
            </Typography>
            <Chip
              label={`${items.length} bien${items.length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, overflowX: 'auto' }}>
          {/* Property cards header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `180px repeat(${items.length}, 1fr)`,
              gap: 0,
              borderBottom: '2px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            {/* Empty corner */}
            <Box sx={{ p: 2 }} />

            {/* Ad header cards */}
            {items.map((ad) => {
              const cover = ad.images?.find((i) => i.is_primary) ?? ad.images?.[0];
              return (
                <Box
                  key={ad.id}
                  sx={{
                    p: 2,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {/* Cover image */}
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
                    {/* Remove button */}
                    <IconButton
                      size="small"
                      onClick={() => remove(ad.id)}
                      sx={{
                        position: 'absolute', top: 4, right: 4,
                        bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                        width: 22, height: 22,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                      }}
                    >
                      <Close sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      {ad.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ad.quarter?.name}{ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
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

          {/* Criteria rows */}
          {[...CRITERIA, ...allAttributes.map((attr) => ({
            label: ATTRIBUTE_LABELS[attr] ?? attr,
            render: (ad: Ad) => (ad.attributes ?? []).includes(attr as PropertyAttribute)
              ? <Check color="success" sx={{ fontSize: 18 }} />
              : <Typography variant="caption" color="text.disabled">—</Typography>,
          }))].map(({ label, render }, idx) => (
            <Box
              key={label}
              sx={{
                display: 'grid',
                gridTemplateColumns: `180px repeat(${items.length}, 1fr)`,
                bgcolor: idx % 2 === 0 ? 'background.paper' : 'grey.50',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              {/* Label */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize={13}>
                  {label}
                </Typography>
              </Box>

              {/* Values */}
              {items.map((ad) => (
                <Box
                  key={ad.id}
                  sx={{
                    px: 2,
                    py: 1.75,
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
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Button
            variant="text"
            size="small"
            startIcon={<Close fontSize="small" />}
            onClick={clear}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Tout effacer
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Fermer
          </Button>
        </Box>
      </Dialog>
    </>
  );
}
