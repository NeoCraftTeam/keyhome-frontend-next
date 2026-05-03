'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';
import { brand, gradient } from '@/theme/tokens';

/**
 * Whether the bailleur panel is this Next app (`/owner/*`) vs Laravel Filament.
 * - `next` (default): always link to `/owner/login` on the **current** host (avoids 404 when
 *   `NEXT_PUBLIC_OWNER_URL` points at a subdomain that does not serve this Next build).
 * - `laravel`: build an absolute URL from `NEXT_PUBLIC_OWNER_URL` (Filament `/owner/login`).
 */
function isLaravelOwnerPanel(): boolean {
  const panel = process.env.NEXT_PUBLIC_OWNER_PANEL?.toLowerCase();
  if (panel === 'laravel') {
    return true;
  }
  if (panel === 'next') {
    return false;
  }
  const raw = process.env.NEXT_PUBLIC_OWNER_URL?.trim() || '';
  // Back-compat: .env.example uses Laravel on :8000 for local Filament
  return (
    /:8000\b/.test(raw) ||
    /127\.0\.0\.1:8000/.test(raw) ||
    /localhost:8000/.test(raw)
  );
}

/**
 * Filament bailleur login URL from `NEXT_PUBLIC_OWNER_URL`.
 */
function ownerLaravelLoginFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_OWNER_URL?.trim();
  if (!raw) {
    return '/owner/login';
  }
  const trimmed = raw.replace(/\/$/, '');
  if (trimmed.endsWith('/login')) {
    return trimmed;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (trimmed === '/owner' || trimmed.endsWith('/owner')) {
      return `${trimmed}/login`;
    }
    return `${trimmed}/owner/login`;
  }
  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/\/$/, '') || '';
    if (path === '' || path === '/') {
      url.pathname = '/owner/login';
    } else if (path.endsWith('/owner')) {
      url.pathname = `${path}/login`;
    } else {
      url.pathname = `${path}/login`;
    }
    return url.toString();
  } catch {
    return '/owner/login';
  }
}

function getOwnerLoginHref(): string {
  return isLaravelOwnerPanel() ? ownerLaravelLoginFromEnv() : '/owner/login';
}

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Propriétaires', href: '#landlords' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Témoignages', href: '#testimonials' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { text, textNav, navBg, navBorder, border, surface } =
    useLandingTheme();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on route change / scroll
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'background 0.35s ease, border-color 0.35s ease',
          background: scrolled || menuOpen ? navBg : 'transparent',
          backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
          borderBottom:
            scrolled || menuOpen ? `1px solid ${navBorder}` : 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              zIndex: 101,
            }}
          >
            <Image
              src="/images/logo.png"
              alt="KeyHome — Logo plateforme immobilière en Afrique"
              width={36}
              height={36}
              style={{ borderRadius: 8 }}
            />
            <span
              style={{
                color: text,
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: '-0.5px',
                transition: 'color 0.35s',
              }}
            >
              Key<span style={{ color: brand.primary }}>Home</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div
            className="landing-nav-links"
            style={{ alignItems: 'center', gap: 32 }}
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  color: textNav,
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = brand.primary;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = textNav;
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div
            className="landing-nav-cta"
            style={{ alignItems: 'center', gap: 12 }}
          >
            <PageTransitionLink
              href="/home"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '8px 20px',
                borderRadius: 10,
                background: brand.primary,
                boxShadow: '0 4px 20px rgba(246,71,95,0.35)',
                display: 'inline-block',
              }}
            >
              Visiter
            </PageTransitionLink>

            <PageTransitionLink
              href={getOwnerLoginHref()}
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '8px 20px',
                borderRadius: 10,
                background: gradient.primary135,
                boxShadow: '0 4px 20px rgba(246,71,95,0.35)',
                display: 'inline-block',
              }}
            >
              Annoncer
            </PageTransitionLink>
          </div>

          {/* Mobile menu trigger */}
          <div
            className="landing-hamburger"
            style={{ alignItems: 'center', gap: 10 }}
          >
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 9 : 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background 0.3s',
                }}
              />
              <motion.span
                animate={{
                  opacity: menuOpen ? 0 : 1,
                  scaleX: menuOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background 0.3s',
                }}
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -9 : 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background 0.3s',
                }}
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
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
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
                onClick={() => setMenuOpen(false)}
                style={{
                  color: text,
                  textDecoration: 'none',
                  fontSize: 17,
                  fontWeight: 600,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: surface,
                  border: `1px solid ${border}`,
                  display: 'block',
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = brand.primary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = text;
                }}
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
                href="/home"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  padding: '14px 20px',
                  borderRadius: 12,
                  background: brand.primary,
                  boxShadow: '0 4px 24px rgba(246,71,95,0.4)',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                Visiter
              </PageTransitionLink>
              <PageTransitionLink
                href={getOwnerLoginHref()}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  padding: '14px 20px',
                  borderRadius: 12,
                  background: gradient.primary135,
                  boxShadow: '0 4px 24px rgba(246,71,95,0.4)',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                Annoncer
              </PageTransitionLink>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
