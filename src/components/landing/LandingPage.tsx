'use client';

import { LandingThemeProvider, useLandingTheme } from '@/components/landing/LandingThemeContext';
import { PageTransitionOverlay } from '@/components/landing/PageTransition';
import CTASection from '@/components/landing/CTASection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandlordSection from '@/components/landing/LandlordSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import { motion } from 'framer-motion';

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
        <LandlordSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
      <PageTransitionOverlay />
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingInner />
    </LandingThemeProvider>
  );
}
