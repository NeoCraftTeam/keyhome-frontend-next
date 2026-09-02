'use client';

import api from '@/lib/api';
import { BRAND_TAGLINE } from '@/lib/brand';
import { buildNlpParams } from '@/lib/nlp-search';
import { useCurrency } from '@/providers/CurrencyProvider';
import { brand, semantic } from '@/theme/tokens';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Search from '@mui/icons-material/Search';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import VoiceSearchButton from '../search/VoiceSearchButton';
import { useLandingTheme } from './LandingThemeContext';

const HeroVideoBackground = dynamic(() => import('./HeroVideoBackground'), {
  ssr: false,
  loading: () => null,
});

const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
    />
  ),
});

import { DURATION, EASE_OUT as EASE } from './landing-motion';

/**
 * Le hero est la seule séquence jouée au montage et non au défilement : ses
 * enfants avancent de 40 px, davantage qu'un `REVEAL_ITEM` de liste, et la
 * cascade démarre après un souffle (`delayChildren`) pour laisser la vidéo
 * s'établir. Seule la durée est empruntée au vocabulaire commun — elle n'a
 * aucune raison de différer du reste de la page.
 */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE },
  },
};

const PLACEHOLDER_EXAMPLES = [
  'Appartement 3 pièces à Douala moins de 100 000 FCFA...',
  'Villa avec piscine à Abidjan Cocody...',
  'Studio meublé à Yaoundé avec parking...',
  'Maison 4 chambres à Lomé pas cher...',
  'Terrain 500m² à Cotonou proche centre...',
];

const QUICK_SUGGESTIONS = [
  'Maison à Douala moins de 50 000',
  'Appartement meublé à Yaoundé',
  'Villa avec piscine à Abidjan',
  'Studio à Cotonou pas cher',
];

export default function HeroSection() {
  const { isDark, text, textSub, textMuted, bg } = useLandingTheme();
  const router = useRouter();
  const { currency } = useCurrency();
  const [, startTransition] = useTransition();
  const shouldReduce = useReducedMotion();

  // Skip heavy Three.js canvas on mobile for better LCP / performance
  // null = unmounted (SSR) → treat as desktop to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // AI search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchIconHovered, setSearchIconHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animated placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (isFocused || query) return;

    const fullText = PLACEHOLDER_EXAMPLES[placeholderIdx];

    // Reduced motion: reveal the full example instantly, skip the typewriter loop.
    if (shouldReduce) {
      if (displayedPlaceholder !== fullText) {
        setDisplayedPlaceholder(fullText);
      }
      return;
    }

    if (isTyping) {
      if (displayedPlaceholder.length < fullText.length) {
        const timer = setTimeout(() => {
          setDisplayedPlaceholder(
            fullText.slice(0, displayedPlaceholder.length + 1)
          );
        }, 35);
        return () => clearTimeout(timer);
      }
      // Pause at full text before deleting
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }

    // Deleting
    if (displayedPlaceholder.length > 0) {
      const timer = setTimeout(() => {
        setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
      }, 20);
      return () => clearTimeout(timer);
    }
    // Move to next example
    setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    setIsTyping(true);
  }, [
    displayedPlaceholder,
    isTyping,
    placeholderIdx,
    isFocused,
    query,
    shouldReduce,
  ]);

  // Forward-declared ref: filled in by an effect once `handleAISearch` is
  // defined below, so voice-transcript callbacks can fire without taking the
  // memoised search callback as a dependency (which would re-bind every render).
  const handleAISearchRef = useRef<(q?: string) => void>(() => {});

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setQuery(transcript);
    handleAISearchRef.current(transcript);
  }, []);

  const handleAISearch = useCallback(
    async (q?: string) => {
      const searchQuery = (q ?? query).trim();
      if (!searchQuery) {
        router.push('/search');
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const res = await api.post('/search/parse', {
          q: searchQuery,
          display_currency: currency,
        });
        const params = buildNlpParams(res.data);
        startTransition(() => router.push(`/search?${params.toString()}`));
      } catch {
        setError('Impossible de traiter votre recherche. Réessayez.');
      } finally {
        setIsSearching(false);
      }
    },
    [query, router, startTransition, currency]
  );

  useEffect(() => {
    handleAISearchRef.current = handleAISearch;
  }, [handleAISearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAISearch();
    }
  };

  const heroBg = isDark
    ? 'linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #0F0A15 100%)'
    : 'linear-gradient(135deg, #F0F2FA 0%, #F5EFFE 50%, #EEF2FA 100%)';

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-section"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: heroBg,
        transition: 'background 0.4s ease',
      }}
    >
      {/* Property video/image showcase background — skipped on mobile */}
      {isMobile !== true && <HeroVideoBackground isDark={isDark} />}

      {/* Canvas2D animated particle overlay — skipped on mobile for better LCP */}
      {isMobile !== true && !shouldReduce && <ThreeCanvas />}

      {/* Radial gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(246,71,95,0.12) 0%, transparent 70%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom fade to next section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: `linear-gradient(to bottom, transparent, ${bg})`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          padding:
            'clamp(72px, 10vh, 140px) clamp(16px, 5vw, 40px) clamp(48px, 8vh, 100px)',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 100,
                background: brand.primaryAlpha12,
                border: `1px solid ${brand.primaryAlpha25}`,
                color: brand.primary,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.2px',
                lineHeight: 1.35,
                maxWidth: 380,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: brand.primary,
                  display: 'inline-block',
                  animation: 'pulseGlow 2s infinite',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                {BRAND_TAGLINE}
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-title"
            variants={itemVariants}
            style={{
              fontSize: 'clamp(32px, 7vw, 80px)',
              fontWeight: 800,
              color: text,
              lineHeight: 1.1,
              letterSpacing: 'clamp(-1px, -0.03em, -2px)',
              margin: '0 0 20px',
              wordBreak: 'break-word',
              transition: 'color 0.4s ease',
            }}
          >
            Trouvez votre{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${brand.primary} 20%, #FF8C94 80%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              maison idéale
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 'clamp(17px, 2.5vw, 21px)',
              color: textSub,
              lineHeight: 1.65,
              margin: '0 auto 44px',
              maxWidth: 600,
              transition: 'color 0.4s ease',
            }}
          >
            Des milliers d&apos;annonces immobilières vérifiées, partout dans le
            monde. Maisons, appartements, terrains et villas — accédez aux
            coordonnées en toute sécurité.
          </motion.p>

          {/* AI Search bar */}
          <motion.div variants={itemVariants}>
            <div
              style={{
                position: 'relative',
                maxWidth: 860,
                margin: '0 auto',
                width: '100%',
              }}
            >
              {/* Main search container */}
              <div
                className="hero-search-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: isFocused
                    ? isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.95)'
                    : isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.8)',
                  border: `1.5px solid ${isFocused ? 'rgba(246,71,95,0.5)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 24,
                  padding: '8px 10px 8px 24px',
                  /* Chaque propriété est nommée : `all` ferait transiter aussi
                     `padding`/`border-width`, deux déclencheurs de relayout à
                     chaque focus, et empêcherait de régler le temps du halo
                     indépendamment de la couleur. */
                  transition:
                    'background-color 0.3s var(--ease-out), border-color 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out)',
                  backdropFilter: 'blur(20px)',
                  width: '100%',
                  boxSizing: 'border-box',
                  boxShadow: isFocused
                    ? '0 8px 40px rgba(246,71,95,0.15), 0 0 0 1px rgba(246,71,95,0.1)'
                    : '0 4px 24px rgba(0,0,0,0.12)',
                }}
              >
                <AutoAwesome
                  style={{
                    color: isFocused ? brand.primary : textMuted,
                    fontSize: 22,
                    flexShrink: 0,
                    transition: 'color 0.3s',
                  }}
                />
                <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setError(null);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                    aria-label="Décrivez le bien que vous recherchez"
                    style={{
                      width: '100%',
                      padding: '18px 14px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: text,
                      fontSize: 'clamp(16px, 2.2vw, 19px)',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                  />
                  {/* Animated placeholder overlay */}
                  {!query && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 12,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        color: textMuted,
                        fontSize: 'clamp(16px, 2.2vw, 19px)',
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayedPlaceholder}
                      <span
                        style={{
                          display: 'inline-block',
                          width: 2,
                          height: '1.2em',
                          background: brand.primary,
                          marginLeft: 1,
                          animation: 'blink 1s step-end infinite',
                          opacity: 0.7,
                          verticalAlign: 'middle',
                        }}
                      />
                    </div>
                  )}
                </div>
                {isSearching ? (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        border: '2.5px solid rgba(246,71,95,0.2)',
                        borderTopColor: brand.primary,
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <VoiceSearchButton
                      onTranscript={handleVoiceTranscript}
                      disabled={isSearching}
                      size={24}
                    />
                    <button
                      type="button"
                      onClick={() => handleAISearch()}
                      aria-label="Rechercher"
                      onMouseEnter={() => setSearchIconHovered(true)}
                      onMouseLeave={() => setSearchIconHovered(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 44,
                        minHeight: 44,
                        padding: 6,
                        margin: 0,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        borderRadius: 12,
                        transform: searchIconHovered
                          ? 'scale(1.08)'
                          : 'scale(1)',
                        transition:
                          'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      <Search
                        style={{
                          color:
                            isFocused || searchIconHovered
                              ? brand.primary
                              : textMuted,
                          fontSize: 26,
                          transition: 'color 0.2s',
                          display: 'block',
                        }}
                      />
                    </button>
                  </>
                )}
              </div>

              {/* Quick suggestions — shown on focus without text */}
              <AnimatePresence>
                {isFocused && !query && (
                  <motion.div
                    key="quick-suggestions"
                    /* Le panneau grandit depuis le bord de la barre, pas depuis
                       son propre centre : ancré à son déclencheur, il se lit
                       comme un prolongement du champ. Il se replie plus vite
                       qu'il ne s'ouvre. */
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: DURATION.enter, ease: EASE },
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                      scale: 0.98,
                      transition: { duration: DURATION.exit, ease: EASE },
                    }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      transformOrigin: 'top center',
                      background: isDark
                        ? 'rgba(18,18,26,0.95)'
                        : 'rgba(255,255,255,0.98)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: 16,
                      overflow: 'hidden',
                      zIndex: 50,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      padding: '8px 0',
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 16px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AutoAwesome
                        style={{ fontSize: 13, color: brand.primary }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: textMuted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Essayez par exemple
                      </span>
                    </div>
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setQuery(suggestion);
                          handleAISearch(suggestion);
                        }}
                        className="hero-suggestion-btn"
                        style={
                          {
                            '--sugg-fg': text,
                            '--sugg-hover': isDark
                              ? 'rgba(246,71,95,0.1)'
                              : 'rgba(246,71,95,0.05)',
                          } as CSSProperties
                        }
                      >
                        <Search style={{ fontSize: 15, color: textMuted }} />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  style={{
                    color: semantic.errorBright,
                    fontSize: 13,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* Badge de recherche IA.
                Aucune liste de villes ici : six villes d'un même continent
                affichées sous le champ signent la portée du service — un
                visiteur de Lisbonne ou de Montréal en déduit que KeyHome ne
                couvre pas chez lui. La recherche, elle, accepte le monde
                entier. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 100,
                  background: brand.primaryAlpha10,
                  border: `1px solid ${brand.primaryAlpha25}`,
                  color: brand.primary,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <AutoAwesome aria-hidden style={{ fontSize: 11 }} />
                Recherche IA
              </span>
            </div>
          </motion.div>

          {/* Mobile CTA buttons — visible only on small screens */}
          <motion.div
            variants={itemVariants}
            className="hero-mobile-cta"
            style={{
              marginTop: 32,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Link
              href="/home"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: 10,
                background: brand.primary,
                boxShadow: '0 4px 20px rgba(246,71,95,0.4)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Visiter
            </Link>
            <Link
              href="/owner/login"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: 10,
                background: brand.primary,
                boxShadow: '0 4px 20px rgba(246,71,95,0.4)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Annoncer
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
