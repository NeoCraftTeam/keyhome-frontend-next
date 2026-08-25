'use client';

import { Price } from '@/components/ui/typography/Price';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { Box, Button, Typography } from '@mui/material';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { useState } from 'react';

interface StickyPropertyBarProps {
  price: number;
  title: string;
  /** Called when user taps the contact CTA (e.g. when locked, scroll to unlock) */
  onContact: () => void;
  /** Hide on desktop (md+) when sidebar contact panel is already visible */
  hideOnDesktop?: boolean;
  /** When unlocked: direct WhatsApp link. When set, shows WhatsApp + Appeler. */
  whatsappUrl?: string;
  /** When unlocked: direct tel: link. When set with whatsappUrl, shows both buttons. */
  phoneUrl?: string;
  /** When provided, shows a Message button that calls this handler. */
  onMessage?: () => void;
  /**
   * When provided and the ad is unlocked, shows a "Réserver une visite"
   * button that triggers the viewing booking flow on mobile.
   */
  onBooking?: () => void;
  /** Host given name — personalises CTAs. */
  hostFirstName?: string;
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
  whatsappUrl,
  phoneUrl,
  onMessage,
  onBooking,
  hostFirstName,
}: StickyPropertyBarProps) {
  const hasDirectButtons = !!(
    whatsappUrl ||
    phoneUrl ||
    onMessage ||
    onBooking
  );
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduce = useReducedMotion();
  const outQuint = [0.22, 1, 0.36, 1] as const;

  const messageLabel = hostFirstName
    ? `Échanger avec ${hostFirstName}`
    : "Échanger avec l'hôte";
  const phoneLabel = hostFirstName ? `Appeler ${hostFirstName}` : 'Appeler';
  const contactLabel = hostFirstName
    ? `Contacter ${hostFirstName}`
    : 'Contacter';

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const next = latest > 300;
    setIsVisible((prev) => (prev === next ? prev : next));
  });

  return (
    <motion.div
      initial={shouldReduce ? false : { y: 100, opacity: 0 }}
      animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
      transition={
        shouldReduce ? { duration: 0 } : { duration: 0.34, ease: outQuint }
      }
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
        component={motion.div}
        whileHover={
          shouldReduce
            ? undefined
            : {
                y: -3,
                boxShadow: '0 -12px 40px rgba(0,0,0,0.16)',
                transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              }
        }
        sx={{
          display: hideOnDesktop ? { xs: 'flex', md: 'none' } : 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0,
          px: 2,
          pt: 1.25,
          pb: 'max(0.875rem, env(safe-area-inset-bottom))',
          bgcolor: 'background.paper',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          // No backdrop-blur: the bar sits on an opaque `background.paper`, so
          // the blur was invisible yet still forced a per-frame repaint.
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <motion.div
            animate={
              shouldReduce
                ? {}
                : isVisible
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.9, opacity: 0.65 }
            }
            transition={
              shouldReduce
                ? { duration: 0 }
                : { duration: 0.28, ease: outQuint }
            }
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                fontSize: '1.15rem',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              <Price amountXAF={price} />
            </Typography>
          </motion.div>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        {hasDirectButtons ? (
          /* ── Unlocked: 2-row action layout ────────────────────────── */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              mt: 0.5,
            }}
          >
            {/* Primary row: Visite + primary contact CTA */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onBooking && (
                <Button
                  variant="outlined"
                  size="medium"
                  component={motion.button}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  onClick={onBooking}
                  aria-label="Proposer une visite"
                  startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    flex: onMessage ? '0 0 auto' : 1,
                    minWidth: onMessage ? 110 : 'auto',
                    minHeight: 44,
                    borderRadius: '10px',
                    py: 1.1,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'rgba(246,71,95,0.06)',
                    },
                  }}
                >
                  Visite
                </Button>
              )}
              {onMessage && (
                <Button
                  variant="contained"
                  size="medium"
                  component={motion.button}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  onClick={onMessage}
                  startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: '10px',
                    py: 1.1,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(246,71,95,0.22)',
                    bgcolor: '#F6475F',
                    '&:hover': {
                      bgcolor: '#e03050',
                      boxShadow: '0 4px 12px rgba(246,71,95,0.32)',
                    },
                  }}
                >
                  {messageLabel}
                </Button>
              )}
              {/* Fallback primary CTA when only phone/WhatsApp available */}
              {!onMessage && !onBooking && (whatsappUrl || phoneUrl) && (
                <Button
                  variant="contained"
                  size="medium"
                  href={whatsappUrl ?? phoneUrl}
                  target={whatsappUrl ? '_blank' : undefined}
                  rel={whatsappUrl ? 'noopener noreferrer' : undefined}
                  component={motion.a}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  aria-label={
                    whatsappUrl ? 'Contacter par WhatsApp' : phoneLabel
                  }
                  startIcon={
                    whatsappUrl ? (
                      <WhatsApp sx={{ fontSize: 16 }} />
                    ) : (
                      <PhoneIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  sx={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: '10px',
                    py: 1.1,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    bgcolor: whatsappUrl ? '#128C7E' : '#F6475F',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: whatsappUrl ? '#0e7268' : '#e03050' },
                  }}
                >
                  {whatsappUrl ? 'WhatsApp' : phoneLabel}
                </Button>
              )}
            </Box>

            {/* Secondary row: compact icon+label buttons for WhatsApp and/or Phone (only when primary row already has onMessage) */}
            {onMessage && (whatsappUrl || phoneUrl) && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {whatsappUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    component={motion.a}
                    whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                    aria-label="Contacter par WhatsApp"
                    startIcon={<WhatsApp sx={{ fontSize: 15 }} />}
                    sx={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: '8px',
                      py: 0.6,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: '#128C7E',
                      color: '#128C7E',
                      '&:hover': { bgcolor: 'rgba(18,140,126,0.06)' },
                    }}
                  >
                    WhatsApp
                  </Button>
                )}
                {phoneUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    href={phoneUrl}
                    component={motion.a}
                    whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                    aria-label={phoneLabel}
                    startIcon={<PhoneIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: '8px',
                      py: 0.6,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: '#F6475F',
                      color: '#F6475F',
                      '&:hover': { bgcolor: 'rgba(246,71,95,0.06)' },
                    }}
                  >
                    {phoneLabel}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* ── Locked / no direct buttons: single CTA ─────────────── */
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={motion.button}
            whileTap={shouldReduce ? undefined : { scale: 0.96 }}
            whileHover={shouldReduce ? undefined : { scale: 1.03 }}
            startIcon={<PhoneIcon sx={{ fontSize: 20 }} />}
            onClick={onContact}
            sx={{
              borderRadius: '12px',
              px: 2.5,
              py: 1.5,
              minHeight: 48,
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 4px 12px rgba(246, 71, 95, 0.3)' },
            }}
          >
            {contactLabel}
          </Button>
        )}
      </Box>
    </motion.div>
  );
}
