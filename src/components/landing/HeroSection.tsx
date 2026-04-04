'use client';

import api from '@/lib/api';
import { useCountUp } from '@/hooks/useCountUp';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Search from '@mui/icons-material/Search';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useLandingTheme } from './LandingThemeContext';
import { useLandingStats, type LandingStat } from '@/hooks/useLandingStats';
import { brand } from '@/theme/tokens';

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

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Single animated stat number for the hero section */
function AnimatedStatNumber({
  stat,
  textColor,
  mutedColor,
}: {
  stat: LandingStat;
  textColor: string;
  mutedColor: string;
}) {
  const { value: counted, ref } = useCountUp({
    end: stat.rawValue,
    duration: 1400,
    triggerOnce: true,
  });

  const formatted =
    stat.rawValue > 0
      ? new Intl.NumberFormat('fr-FR').format(counted) + stat.suffix
      : stat.value;

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-1px',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.4s ease',
        }}
      >
        {formatted}
      </div>
      <div
        style={{
          fontSize: 13,
          color: mutedColor,
          marginTop: 2,
          transition: 'color 0.4s ease',
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const CITIES = ['Douala', 'Garoua', 'Accra', 'Cotonou', 'Lomé', 'Bafoussam'];

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
  const { isDark, text, textSub, textMuted, bg, border } = useLandingTheme();
  const router = useRouter();
  const { stats, isLoading: statsLoading } = useLandingStats();
  const [, startTransition] = useTransition();

  // Skip heavy Three.js canvas on mobile for better LCP / performance
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // AI search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animated placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (isFocused || query) return;

    const fullText = PLACEHOLDER_EXAMPLES[placeholderIdx];

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
  }, [displayedPlaceholder, isTyping, placeholderIdx, isFocused, query]);

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
        const res = await api.post('/search/parse', { q: searchQuery });
        const parsed = res.data;
        const params = new URLSearchParams();
        if (parsed.q) params.set('q', parsed.q);
        if (parsed.city_id) params.set('city', parsed.city_id);
        if (parsed.type_id) params.set('type', parsed.type_id);
        if (parsed.bedrooms) params.set('bedrooms', String(parsed.bedrooms));
        if (parsed.price_max) params.set('price_max', String(parsed.price_max));
        if (parsed.price_min) params.set('price_min', String(parsed.price_min));
        if (parsed.has_parking) params.set('parking', '1');
        if (parsed.surface_min)
          params.set('surface_min', String(parsed.surface_min));

        startTransition(() => {
          router.push(`/search?${params.toString()}`);
        });
      } catch {
        setError('Impossible de traiter votre recherche. Réessayez.');
      } finally {
        setIsSearching(false);
      }
    },
    [query, router, startTransition]
  );

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
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: heroBg,
        transition: 'background 0.4s ease',
      }}
    >
      {/* Property video/image showcase background — skipped on mobile */}
      {!isMobile && <HeroVideoBackground isDark={isDark} />}

      {/* Canvas2D animated particle overlay — skipped on mobile for better LCP */}
      {!isMobile && <ThreeCanvas />}

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
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 100,
                background: 'rgba(246, 71, 95, 0.12)',
                border: '1px solid rgba(246, 71, 95, 0.25)',
                color: brand.primary,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: brand.primary,
                  display: 'inline-block',
                  animation: 'pulseGlow 2s infinite',
                }}
              />
              Plateforme immobilière panafricaine
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
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
            Des milliers d&apos;annonces immobilières vérifiées à travers
            l&apos;Afrique. Maisons, appartements, terrains et villas — accédez
            aux coordonnées en toute sécurité.
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
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
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
                  <button
                    onClick={() => handleAISearch()}
                    aria-label="Rechercher"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 14,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'transform 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform =
                        'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform =
                        'scale(1)';
                    }}
                  >
                    <Search
                      style={{
                        color: textMuted,
                        fontSize: 24,
                        transition: 'color 0.2s',
                      }}
                    />
                  </button>
                )}
              </div>

              {/* Quick suggestions — shown on focus without text */}
              {isFocused && !query && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: text,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          isDark
                            ? 'rgba(246,71,95,0.1)'
                            : 'rgba(246,71,95,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          'transparent';
                      }}
                    >
                      <Search style={{ fontSize: 15, color: textMuted }} />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <p
                  style={{
                    color: '#F87070',
                    fontSize: 13,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* AI badge + city chips */}
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
                  background: 'rgba(246,71,95,0.1)',
                  border: '1px solid rgba(246,71,95,0.2)',
                  color: brand.primary,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <AutoAwesome style={{ fontSize: 11 }} />
                Recherche IA
              </span>
              <span style={{ color: textMuted, fontSize: 12, margin: '0 4px' }}>
                •
              </span>
              <span style={{ color: textMuted, fontSize: 12 }}>
                Populaires :
              </span>
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/search?city=${city.toLowerCase()}`}
                  style={{ textDecoration: 'none' }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '3px 10px',
                      borderRadius: 100,
                      background: 'transparent',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      color: textSub,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        'rgba(246,71,95,0.1)';
                      (e.currentTarget as HTMLElement).style.borderColor =
                        brand.primaryAlpha30;
                      (e.currentTarget as HTMLElement).style.color =
                        brand.primary;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor =
                        isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                      (e.currentTarget as HTMLElement).style.color = textSub;
                    }}
                  >
                    {city}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Social proof — animated count-up */}
          <motion.div
            variants={itemVariants}
            className="hero-stats"
            style={{ marginTop: 56 }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  opacity: !statsLoading ? 1 : 0.4,
                  transition: 'opacity 0.5s ease',
                }}
              >
                <AnimatedStatNumber
                  stat={stat}
                  textColor={text}
                  mutedColor={textMuted}
                />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{
            width: 22,
            height: 36,
            borderRadius: 12,
            border: `2px solid ${border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '5px 0',
          }}
        >
          <div
            style={{
              width: 3,
              height: 8,
              borderRadius: 2,
              background: textSub,
            }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
