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
          px: 2.5,
          py: 2.5,
          pt: 2,
          pb: 'max(1.25rem, env(safe-area-inset-bottom))',
          bgcolor: 'background.paper',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              fontSize: '1.25rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            {formatPrice(price)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PhoneIcon sx={{ fontSize: 20 }} />}
          onClick={onContact}
          sx={{
            flexShrink: 0,
            borderRadius: '12px',
            px: 2.5,
            py: 1.5,
            minHeight: 48,
            fontWeight: 700,
            fontSize: '0.95rem',
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
