'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Témoignages', href: '#testimonials' },
];

/** Smooth-scroll to an anchor section, accounting for the fixed navbar height */
function scrollToSection(href: string) {
  if (!href.startsWith('#')) return;
  const id = href.slice(1);
  const el = document.getElementById(id);
  if (el) {
    const navHeight = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggle, text, textNav, navBg, navBorder, border, bg: _bg, surface } = useLandingTheme();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on route change / scroll
  useEffect(() => {
    if (menuOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
          background: (scrolled || menuOpen) ? navBg : 'transparent',
          backdropFilter: (scrolled || menuOpen) ? 'blur(20px)' : 'none',
          borderBottom: (scrolled || menuOpen) ? `1px solid ${navBorder}` : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', zIndex: 101 }}>
            <Image src="/images/logo.png" alt="KeyHome" width={36} height={36} style={{ borderRadius: 8 }} />
            <span style={{ color: text, fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px', transition: 'color 0.35s' }}>
              Key<span style={{ color: '#F6475F' }}>Home</span>
            </span>
          </a>

          {/* Desktop links — with smooth scroll for anchor links */}
          <div className="landing-nav-links" style={{ alignItems: 'center', gap: 32 }}>
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('#')) {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }
                }}
                style={{ color: textNav, textDecoration: 'none', fontSize: 15, fontWeight: 500, transition: 'color 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#F6475F'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = textNav; }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA + toggle */}
          <div className="landing-nav-cta" style={{ alignItems: 'center', gap: 12 }}>
            {/* Dark/Light toggle */}
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.9 }}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              style={{
                width: 46, height: 26, borderRadius: 13, padding: 3,
                border: `1px solid ${border}`,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                position: 'relative', transition: 'border-color 0.3s, background 0.3s', flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: isDark ? 0 : 20 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: isDark ? 'linear-gradient(135deg, #8080b0, #5050a0)' : 'linear-gradient(135deg, #FFc040, #F6475F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0,
                }}
              >
                <motion.span
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ scale: 0, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ lineHeight: 1 }}
                >
                  {isDark ? '🌙' : '☀️'}
                </motion.span>
              </motion.div>
            </motion.button>

            <PageTransitionLink
              href="/login"
              style={{
                color: textNav, textDecoration: 'none', fontSize: 15, fontWeight: 500,
                padding: '8px 18px', borderRadius: 10, border: `1px solid ${border}`,
                display: 'inline-block', transition: 'color 0.35s, border-color 0.35s, background 0.2s',
              }}
            >
              Connexion
            </PageTransitionLink>

            <PageTransitionLink
              href="/register"
              style={{
                color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600,
                padding: '8px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                boxShadow: '0 4px 20px rgba(246,71,95,0.35)',
                display: 'inline-block',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
            >
              S&apos;inscrire gratuitement
            </PageTransitionLink>
          </div>

          {/* Mobile right side: toggle + hamburger */}
          <div className="landing-hamburger" style={{ alignItems: 'center', gap: 10 }}>
            {/* Theme toggle (always visible on mobile) */}
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.9 }}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              style={{
                width: 40, height: 22, borderRadius: 11, padding: 2,
                border: `1px solid ${border}`,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'border-color 0.3s, background 0.3s', flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: isDark ? 0 : 17 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: isDark ? 'linear-gradient(135deg, #8080b0, #5050a0)' : 'linear-gradient(135deg, #FFc040, #F6475F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0,
                }}
              >
                <motion.span
                  key={isDark ? 'moon-m' : 'sun-m'}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ lineHeight: 1 }}
                >
                  {isDark ? '🌙' : '☀️'}
                </motion.span>
              </motion.div>
            </motion.button>

            {/* Hamburger icon */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 6, display: 'flex', flexDirection: 'column',
                gap: 5, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 9 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: text, transition: 'background 0.3s' }}
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: text, transition: 'background 0.3s' }}
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -9 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: text, transition: 'background 0.3s' }}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="landing-mobile-menu open"
            style={{ background: navBg }}
          >
            {/* Nav links */}
            {NAV_LINKS.map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (item.href.startsWith('#')) {
                    e.preventDefault();
                    setTimeout(() => scrollToSection(item.href), 100);
                  }
                }}
                style={{
                  color: text, textDecoration: 'none', fontSize: 17, fontWeight: 600,
                  padding: '14px 16px', borderRadius: 12,
                  background: surface, border: `1px solid ${border}`,
                  display: 'block', transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F6475F'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = text; }}
              >
                {item.label}
              </motion.a>
            ))}

            <div style={{ height: 1, background: border, margin: '8px 0' }} />

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <PageTransitionLink
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: textNav, textDecoration: 'none', fontSize: 16, fontWeight: 600,
                  padding: '14px 20px', borderRadius: 12, border: `1px solid ${border}`,
                  display: 'block', textAlign: 'center', transition: 'color 0.2s',
                }}
              >
                Connexion
              </PageTransitionLink>
              <PageTransitionLink
                href="/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700,
                  padding: '14px 20px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                  boxShadow: '0 4px 24px rgba(246,71,95,0.4)',
                  display: 'block', textAlign: 'center',
                }}
              >
                S&apos;inscrire gratuitement
              </PageTransitionLink>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
