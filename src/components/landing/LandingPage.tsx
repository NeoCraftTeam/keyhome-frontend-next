'use client';

import { LandingThemeProvider, useLandingTheme } from '@/components/landing/LandingThemeContext';
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
import { useThemeMode } from '@/providers/ThemeProvider';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Revenir en haut de la page"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 90,
            width: 44,
            height: 44,
            borderRadius: 12,
            border: `1px solid ${border}`,
            background: 'rgba(246,71,95,0.1)',
            backdropFilter: 'blur(10px)',
            color: text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          ↑
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
      style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', background: bg, transition: 'background 0.4s ease', overflowX: 'hidden' }}
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
  const { setThemeChoice, choice } = useThemeMode();
  const prevChoice = useRef(choice);

  useEffect(() => {
    prevChoice.current = choice;
    setThemeChoice('dark');
    return () => {
      setThemeChoice(prevChoice.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LandingThemeProvider>
      <MotionConfig reducedMotion="user">
        <LandingInner />
      </MotionConfig>
    </LandingThemeProvider>
  );
}
