'use client';

import { formatPrice } from '@/lib/constants';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsApp from '@mui/icons-material/WhatsApp';

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
  hostFirstName,
}: StickyPropertyBarProps) {
  const hasDirectButtons = !!(whatsappUrl || phoneUrl || onMessage);
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
    setIsVisible(latest > 300);
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
          flexDirection: hasDirectButtons ? 'column' : 'row',
          alignItems: hasDirectButtons ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: hasDirectButtons ? 1 : 2,
          px: 2.5,
          pt: 1.5,
          pb: 'max(1rem, env(safe-area-inset-bottom))',
          bgcolor: 'background.paper',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(12px)',
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
              {formatPrice(price)}
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

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            width: hasDirectButtons ? '100%' : 'auto',
          }}
        >
          {hasDirectButtons ? (
            <>
              {onMessage && (
                <Button
                  variant="contained"
                  size="large"
                  component={motion.button}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  whileHover={shouldReduce ? undefined : { scale: 1.03 }}
                  onClick={onMessage}
                  startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    flex: 1,
                    borderRadius: '12px',
                    py: 1.5,
                    minHeight: 46,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    lineHeight: 1.2,
                    whiteSpace: 'normal',
                    boxShadow: '0 2px 8px rgba(246,71,95,0.25)',
                    bgcolor: '#F6475F',
                    '&:hover': {
                      bgcolor: '#e03050',
                      boxShadow: '0 4px 12px rgba(246,71,95,0.35)',
                    },
                  }}
                >
                  {messageLabel}
                </Button>
              )}
              {whatsappUrl && (
                <Button
                  variant="contained"
                  size="large"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  component={motion.a}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  whileHover={shouldReduce ? undefined : { scale: 1.03 }}
                  startIcon={<WhatsApp sx={{ fontSize: 18 }} />}
                  sx={{
                    flex: 1,
                    borderRadius: '12px',
                    py: 1.5,
                    minHeight: 46,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    bgcolor: '#128C7E',
                    boxShadow: '0 2px 8px rgba(18,140,126,0.25)',
                    '&:hover': {
                      bgcolor: '#0e7268',
                      boxShadow: '0 4px 12px rgba(18,140,126,0.35)',
                    },
                  }}
                >
                  Message WhatsApp
                </Button>
              )}
              {phoneUrl && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  href={phoneUrl}
                  component={motion.a}
                  whileTap={shouldReduce ? undefined : { scale: 0.96 }}
                  whileHover={shouldReduce ? undefined : { scale: 1.03 }}
                  startIcon={<PhoneIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    flex: 1,
                    borderRadius: '12px',
                    py: 1.5,
                    minHeight: 46,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    borderColor: '#F6475F',
                    color: '#F6475F',
                    '&:hover': {
                      borderColor: '#e03050',
                      bgcolor: 'rgba(246,71,95,0.06)',
                    },
                  }}
                >
                  {phoneLabel}
                </Button>
              )}
            </>
          ) : (
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
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 12px rgba(246, 71, 95, 0.3)' },
              }}
            >
              {contactLabel}
            </Button>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}
