'use client';

import CTASection from '@/components/landing/CTASection';
import FAQSection from '@/components/landing/FAQSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import {
  LandingThemeProvider,
  useLandingTheme,
} from '@/components/landing/LandingThemeContext';
import LandlordSection from '@/components/landing/LandlordSection';
import NewsletterSection from '@/components/landing/NewsletterSection';
import { PageTransitionOverlay } from '@/components/landing/PageTransition';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import { brand } from '@/theme/tokens';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { DURATION, EASE_OUT as EASE, PRESS } from './landing-motion';

function BackToTop() {
  const { border, text } = useLandingTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          /* 0.92 et non 0.85 : rien n'apparaît de nulle part. La sortie est
             plus courte que l'entrée — un bouton qu'on quitte ne doit pas se
             faire attendre. */
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: DURATION.enter, ease: EASE },
          }}
          exit={{
            opacity: 0,
            scale: 0.92,
            transition: { duration: DURATION.exit, ease: EASE },
          }}
          whileHover={{ y: -2 }}
          whileTap={PRESS}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Revenir en haut de la page"
          className="landing-back-to-top"
          style={
            {
              '--btt-line': border,
              '--btt-fg': text,
              '--btt-bg': brand.primaryAlpha10,
              '--btt-bg-hover': brand.primaryAlpha15,
              '--btt-line-hover': brand.primaryAlpha30,
            } as CSSProperties
          }
        >
          <span aria-hidden>↑</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function LandingInner() {
  const { bg } = useLandingTheme();

  return (
    <motion.div
      className="landing-page-wrapper"
      style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        background: bg,
        transition: 'background 0.4s ease',
        overflowX: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      <LandingNav />
      <div>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <LandlordSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
        <NewsletterSection />
      </div>
      <LandingFooter />
      <BackToTop />
      <PageTransitionOverlay />
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <MotionConfig reducedMotion="user">
        <LandingInner />
      </MotionConfig>
    </LandingThemeProvider>
  );
}
