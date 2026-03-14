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
  SquareFoot,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

export default function ComparatorBar() {
  const { items, remove, clear, isOpen, setOpen } = useComparator();
  const router = useRouter();

  if (items.length === 0) { return null; }

  const allAttributes = [...new Set(items.flatMap((ad) => ad.attributes ?? []))];

  return (
    <>
      {/* Floating bar */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 99,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <CompareArrows color="primary" />
            <Typography fontWeight={600} fontSize={14}>
              {items.length} bien{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {items.map((ad) => (
                <Tooltip key={ad.id} title={ad.title}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={ad.images[0]?.thumb}
                      sx={{ width: 32, height: 32, cursor: 'pointer' }}
                      onClick={() => remove(ad.id)}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => remove(ad.id)}
                    >
                      <Close sx={{ fontSize: 10, color: 'white' }} />
                    </Box>
                  </Box>
                </Tooltip>
              ))}
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpen(true)}
              disabled={items.length < 2}
              sx={{ borderRadius: 99 }}
            >
              Comparer
            </Button>
            <IconButton size="small" onClick={clear}>
              <Close fontSize="small" />
            </IconButton>
          </Paper>
        </motion.div>
      </AnimatePresence>

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            <CompareArrows sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comparaison de biens
          </Typography>
          <IconButton onClick={() => setOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Critère</TableCell>
                  {items.map((ad) => (
                    <TableCell key={ad.id} align="center" sx={{ minWidth: 200 }}>
                      <Box>
                        {ad.images[0] && (
                          <Box
                            component="img"
                            src={ad.images[0].thumb}
                            alt={ad.title}
                            sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2, mb: 1 }}
                          />
                        )}
                        <Typography variant="body2" fontWeight={700} noWrap>{ad.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ad.quarter?.name}, {ad.quarter?.city_name}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    label: 'Prix / mois',
                    render: (ad: Ad) => (
                      <Typography fontWeight={700} color="primary">
                        {ad.price ? formatPrice(ad.price) : '—'}
                      </Typography>
                    ),
                  },
                  {
                    label: 'Surface',
                    render: (ad: Ad) => `${ad.surface_area} m²`,
                  },
                  {
                    label: 'Chambres',
                    render: (ad: Ad) => (
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <Bed fontSize="small" /> {ad.bedrooms}
                      </Box>
                    ),
                  },
                  {
                    label: 'Salles de bain',
                    render: (ad: Ad) => (
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <Bathtub fontSize="small" /> {ad.bathrooms}
                      </Box>
                    ),
                  },
                  {
                    label: 'Parking',
                    render: (ad: Ad) => ad.has_parking
                      ? <Check color="success" />
                      : <Close color="error" />,
                  },
                  {
                    label: 'Prix/m²',
                    render: (ad: Ad) => ad.price && ad.surface_area
                      ? `${Math.round(ad.price / ad.surface_area).toLocaleString('fr-FR')} FCFA/m²`
                      : '—',
                  },
                  {
                    label: 'Visite 360°',
                    render: (ad: Ad) => ad.has_3d_tour
                      ? <Check color="success" />
                      : <Close color="disabled" />,
                  },
                  ...allAttributes.map((attr) => ({
                    label: ATTRIBUTE_LABELS[attr] ?? attr,
                    render: (ad: Ad) => (ad.attributes ?? []).includes(attr as PropertyAttribute)
                      ? <Check color="success" />
                      : <Close color="disabled" />,
                  })),
                ].map(({ label, render }) => (
                  <TableRow key={label} hover>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 13 }}>
                      {label}
                    </TableCell>
                    {items.map((ad) => (
                      <TableCell key={ad.id} align="center">
                        {render(ad)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* CTA row */}
                <TableRow>
                  <TableCell />
                  {items.map((ad) => (
                    <TableCell key={ad.id} align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => router.push(`/ads/${ad.id}/${ad.slug}`)}
                      >
                        Voir l'annonce
                      </Button>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
