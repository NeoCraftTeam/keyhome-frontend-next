'use client';

import { brand } from '@/theme/tokens';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';
import {
  DURATION,
  EASE_IN_OUT,
  EASE_OUT as EASE,
  PRESS,
} from './landing-motion';
import { PageTransitionLink } from './PageTransition';

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
    window.addEventListener('scroll', handler, { passive: true });
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

  /**
   * Échap referme le menu. Le panneau s'annonce `role="dialog"
   * aria-modal="true"` : sans cette sortie clavier, la promesse est fausse et
   * un utilisateur au clavier reste enfermé dans un calque qui masque la page.
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DURATION.reveal, ease: EASE }}
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
              alt="KeyHome — Logo plateforme immobilière internationale"
              width={36}
              height={36}
              priority
              loading="eager"
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
              /* Le survol est en CSS (`.landing-nav-link`) : posé en JS, il
                 restait allumé sur le dernier lien touché au doigt, puisque
                 `mouseleave` n'arrive jamais sur un écran tactile. */
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link"
                style={
                  {
                    '--nav-fg': textNav,
                    '--nav-fg-hover': brand.primary,
                  } as CSSProperties
                }
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
            {/* `PageTransitionLink` rend un `<a>` : le retour de pression est
                donc en CSS (`.landing-nav-cta-btn:active`) et non en
                `whileTap`. Sans lui, les deux seuls boutons de la barre ne
                répondent pas au doigt. */}
            <PageTransitionLink
              href="/home"
              className="landing-nav-cta-btn"
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
              className="landing-nav-cta-btn"
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
              Annoncer
            </PageTransitionLink>
          </div>

          {/* Mobile menu trigger */}
          <div
            className="landing-hamburger"
            style={{ alignItems: 'center', gap: 10 }}
          >
            <motion.button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              whileTap={PRESS}
              transition={{ duration: DURATION.press, ease: EASE }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: 44,
                height: 44,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Les trois barres se déplacent à l'écran plutôt que d'entrer :
                  `EASE_IN_OUT` accélère puis freine, là où une courbe de sortie
                  ferait démarrer la croix d'un coup sec. */}
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 9 : 0 }}
                transition={{ duration: DURATION.enter, ease: EASE_IN_OUT }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background-color 0.3s var(--ease-out)',
                }}
              />
              <motion.span
                animate={{
                  opacity: menuOpen ? 0 : 1,
                  scaleX: menuOpen ? 0 : 1,
                }}
                transition={{ duration: DURATION.exit, ease: EASE_IN_OUT }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background-color 0.3s var(--ease-out)',
                }}
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -9 : 0 }}
                transition={{ duration: DURATION.enter, ease: EASE_IN_OUT }}
                style={{
                  display: 'block',
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: text,
                  transition: 'background-color 0.3s var(--ease-out)',
                }}
              />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            id="landing-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            initial={{ opacity: 0, y: -16 }}
            /* Le panneau descend de la barre puis remonte s'y ranger, plus vite
               qu'il n'est venu : un calque qu'on congédie ne doit pas se faire
               attendre. */
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: DURATION.enter, ease: EASE },
            }}
            exit={{
              opacity: 0,
              y: -16,
              transition: { duration: DURATION.exit, ease: EASE },
            }}
            className="landing-mobile-menu open"
            style={{ background: navBg }}
          >
            {/* Nav links */}
            {NAV_LINKS.map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="landing-mobile-link"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                /* Les cinq liens montent tous en même temps que le panneau : le
                   décalage n'est pas un retard hérité du défilement, il donne
                   l'ordre de lecture. */
                transition={{
                  delay: i * 0.05,
                  duration: DURATION.enter,
                  ease: EASE,
                }}
                whileTap={PRESS}
                onClick={() => setMenuOpen(false)}
                style={
                  {
                    '--nav-fg': text,
                    '--nav-fg-hover': brand.primary,
                    '--nav-line': border,
                    background: surface,
                  } as CSSProperties
                }
              >
                {item.label}
              </motion.a>
            ))}

            <div style={{ height: 1, background: border, margin: '8px 0' }} />

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: DURATION.enter,
                ease: EASE,
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <PageTransitionLink
                href="/home"
                onClick={() => setMenuOpen(false)}
                className="landing-nav-cta-btn"
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
                className="landing-nav-cta-btn"
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
                Annoncer
              </PageTransitionLink>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
