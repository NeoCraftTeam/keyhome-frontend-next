'use client';

import { formatPrice } from '@/lib/constants';
import { useComparator } from '@/providers/ComparatorProvider';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Ad } from '@/types';
import AccessTime from '@mui/icons-material/AccessTime';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

interface CompareDrawerProps {
  currentAd: Ad;
  open: boolean;
  onClose: () => void;
}

export default function CompareDrawer({
  currentAd,
  open,
  onClose,
}: CompareDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { items: recentlyViewed } = useRecentlyViewed();
  const { add, isSelected } = useComparator();

  const otherRecentlyViewed = recentlyViewed.filter(
    (a) => String(a.id) !== String(currentAd.id)
  );

  const handleAddToCompare = (ad: Ad) => {
    if (!isSelected(ad.id)) {
      add(ad);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 420,
          maxWidth: '100%',
          height: '100%',
          borderTopLeftRadius: isMobile ? 0 : 16,
          borderBottomLeftRadius: isMobile ? 0 : 16,
          boxShadow: '0 0 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="h6" fontWeight={700}>
            Comparer avec
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Fermer">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sélectionnez des annonces récemment consultées pour les comparer
            avec celle-ci.
          </Typography>
          {otherRecentlyViewed.length === 0 ? (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ py: 4, textAlign: 'center' }}
            >
              Aucune autre annonce récemment consultée.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {otherRecentlyViewed.map((ad) => {
                const cover =
                  ad.images?.find((i) => i.is_primary) ?? ad.images?.[0];
                const selected = isSelected(ad.id);
                return (
                  <Box
                    key={ad.id}
                    onClick={() => !selected && handleAddToCompare(ad)}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected
                        ? (t) => alpha(t.palette.primary.main, 0.08)
                        : 'transparent',
                      cursor: selected ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': selected
                        ? {}
                        : {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                          },
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 54,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.200',
                        flexShrink: 0,
                      }}
                    >
                      {cover && (
                        <Box
                          component="img"
                          src={cover.thumb ?? cover.url}
                          alt={ad.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {ad.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        display="block"
                      >
                        {ad.quarter?.name}
                        {ad.quarter?.city_name
                          ? `, ${ad.quarter.city_name}`
                          : ''}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="primary.main"
                      >
                        {formatPrice(ad.price)}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={selected ? 'contained' : 'outlined'}
                      startIcon={<Add sx={{ fontSize: 16 }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!selected) handleAddToCompare(ad);
                      }}
                      disabled={selected}
                      sx={{
                        flexShrink: 0,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                      }}
                    >
                      {selected ? 'Ajouté' : 'Comparer'}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Fermer
        </Button>
      </Box>
    </Drawer>
  );
}
