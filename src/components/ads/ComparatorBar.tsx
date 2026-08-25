'use client';

import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import {
  COMPARATOR_MAX_ITEMS,
  useComparator,
} from '@/providers/ComparatorProvider';
import Close from '@mui/icons-material/Close';
import CompareArrows from '@mui/icons-material/CompareArrows';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { gradient } from '@/theme/tokens';

export default function ComparatorBar() {
  const { items, remove, clear, maxReached, clearMaxReached } = useComparator();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenComparator = () => {
    router.push('/comparaisons');
  };

  const showBar = items.length > 0 && pathname !== '/comparaisons';

  return (
    <MotionConfig reducedMotion="user">
      {/* Floating bar — rendered as a conditional child of AnimatePresence so
          removing the last item (or navigating to /comparaisons) plays the
          slide-out exit instead of unmounting the tree instantly. */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            key="comparator-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 72 : 24,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1200,
              pointerEvents: 'none',
              padding: isMobile ? '0 8px' : 0,
            }}
          >
            <Box sx={{ pointerEvents: 'auto', maxWidth: '100%' }}>
              <Paper
                elevation={12}
                sx={{
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1.25,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1.5 },
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 8px 32px rgba(246,71,95,0.18)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <CompareArrows
                  color="primary"
                  sx={{ fontSize: { xs: 16, sm: 20 }, flexShrink: 0 }}
                />
                <Typography
                  fontWeight={700}
                  fontSize={{ xs: 11, sm: 13 }}
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {items.length} bien{items.length > 1 ? 's' : ''}
                </Typography>

                {/* Avatars */}
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  {items.map((ad) => (
                    <Tooltip key={ad.id} title={`Retirer : ${ad.title}`}>
                      <Box
                        sx={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => remove(ad.id)}
                      >
                        <Avatar
                          src={ad.images?.[0]?.thumb}
                          sx={{
                            width: { xs: 24, sm: 30 },
                            height: { xs: 24, sm: 30 },
                            border: '2px solid white',
                          }}
                        >
                          {ad.title[0]}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                    px: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                    background: gradient.primary,
                    '&:hover': { background: gradient.primaryHover },
                    flexShrink: 0,
                  }}
                >
                  Comparer
                </Button>

                <IconButton
                  size="small"
                  onClick={clear}
                  aria-label="Vider la comparaison"
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Paper>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max reached snackbar — le tableau comparatif s'affiche uniquement sur /comparaisons */}
      <KhSnackbar
        open={maxReached}
        message={`Vous ne pouvez pas comparer plus de ${COMPARATOR_MAX_ITEMS} biens à la fois.`}
        severity="warning"
        onClose={clearMaxReached}
        duration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </MotionConfig>
  );
}
