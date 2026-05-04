'use client';

import {
  LandingThemeProvider,
  useLandingTheme,
} from '@/components/landing/LandingThemeContext';
import { PageTransitionOverlay } from '@/components/landing/PageTransition';
import CTASection from '@/components/landing/CTASection';
import NewsletterSection from '@/components/landing/NewsletterSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandlordSection from '@/components/landing/LandlordSection';
import PricingSection from '@/components/landing/PricingSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FAQSection from '@/components/landing/FAQSection';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useEffect, useState } from 'react';
import { brand } from '@/theme/tokens';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

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
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Revenir en haut de la page"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 90,
            width: 48,
            height: 48,
            borderRadius: 14,
            border: `1px solid ${border}`,
            background: brand.primaryAlpha10,
            backdropFilter: 'blur(10px)',
            color: text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            lineHeight: 1,
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              brand.primaryAlpha15;
            (e.currentTarget as HTMLElement).style.borderColor =
              brand.primaryAlpha30;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              brand.primaryAlpha10;
            (e.currentTarget as HTMLElement).style.borderColor = border;
          }}
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
      }}
    >
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <LandlordSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
        <NewsletterSection />
      </main>
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
