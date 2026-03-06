'use client';

import { formatPrice } from '@/lib/constants';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';

interface StickyPropertyBarProps {
  price: number;
  title: string;
  /** Called when user taps the contact CTA */
  onContact: () => void;
  /** Hide on desktop (md+) when sidebar contact panel is already visible */
  hideOnDesktop?: boolean;
}

/**
 * StickyPropertyBar — floats up from the bottom on mobile after the user
 * scrolls past the hero. Shows price + a contact CTA. Hides when near the top.
 *
 * Usage (in AdDetailClient, mobile only):
 *   <StickyPropertyBar price={ad.price} title={ad.title} onContact={openContact} />
 */
export default function StickyPropertyBar({
  price,
  title,
  onContact,
  hideOnDesktop = true,
}: StickyPropertyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsVisible(latest > 300);
  });

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        // Safe area for iOS home indicator
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // Hide on desktop when sidebar is visible
        ...(hideOnDesktop && { display: 'var(--sticky-bar-display, flex)' }),
      }}
    >
      <Box
        sx={{
          display: hideOnDesktop ? { xs: 'flex', md: 'none' } : 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            {formatPrice(price)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.72rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<PhoneIcon sx={{ fontSize: 18 }} />}
          onClick={onContact}
          sx={{
            flexShrink: 0,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 12px rgba(246, 71, 95, 0.3)' },
          }}
        >
          Contacter
        </Button>
      </Box>
    </motion.div>
  );
}
