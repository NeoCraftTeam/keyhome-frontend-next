'use client';

import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { SvgIconComponent } from '@mui/icons-material';
import { SearchOff } from '@mui/icons-material';

interface EmptyStateProps {
  /** MUI SvgIcon component — defaults to SearchOff */
  Icon?: SvgIconComponent;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  Icon = SearchOff,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: { xs: 6, md: 10 },
          px: 3,
        }}
      >
        {/* Animated icon container */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              bgcolor: 'rgba(246,71,95,0.08)',
              border: '1px solid rgba(246,71,95,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Icon sx={{ fontSize: 44, color: 'primary.main', opacity: 0.7 }} />
          </Box>
        </motion.div>

        <Typography
          variant="h6"
          fontWeight={700}
          color="text.primary"
          sx={{ mb: 1, letterSpacing: '-0.3px' }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 380, lineHeight: 1.6, mb: actionLabel ? 3 : 0 }}
          >
            {description}
          </Typography>
        )}

        {actionLabel && onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{
              mt: 1,
              borderRadius: 2,
              px: 3,
              py: 1.25,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #F6475F, #D93A50)',
              boxShadow: '0 4px 16px rgba(246,71,95,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #E03E54, #C53248)',
                boxShadow: '0 6px 20px rgba(246,71,95,0.45)',
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </motion.div>
  );
}
