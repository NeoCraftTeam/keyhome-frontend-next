'use client';

import api from '@/lib/api';
import { citiesService } from '@/services/cities.service';
import type { City } from '@/types';
import { LocationOn, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';

const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
  ),
});

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const CITIES = ['Douala', 'Garoua', 'Accra', 'Cotonou', 'Lomé', 'Bafoussam'];

export default function HeroSection() {
  const { isDark, text, textSub, textMuted, bg, surface, border } = useLandingTheme();
  const router = useRouter();

  // Skip heavy Three.js canvas on mobile for better LCP / performance
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // City autocomplete state
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic stats
  const [stats, setStats] = useState([
    { value: '2 000+', label: 'Annonces actives' },
    { value: '10+', label: 'Villes couvertes' },
    { value: '5 000+', label: 'Utilisateurs' },
  ]);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const fmt = (n: number): string => {
      if (n >= 1000) {
        return new Intl.NumberFormat('fr-FR').format(n) + '+';
      }
      return n + '+';
    };
    api.get('/stats/landing')
      .then(({ data }) => {
        setStats([
          { value: fmt(data.ads_count ?? 0), label: 'Annonces actives' },
          { value: fmt(data.cities_count ?? 0), label: 'Villes couvertes' },
          { value: fmt(data.users_count ?? 0), label: 'Utilisateurs' },
        ]);
        setStatsLoaded(true);
      })
      .catch(() => { setStatsLoaded(true); /* keep fallback values */ });
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCities = useCallback(async (q: string) => {
    if (q.length < 1) { setCities([]); return; }
    setIsLoading(true);
    try {
      const res = await citiesService.list({ q, per_page: 8 });
      setCities(res.data || []);
    } catch { setCities([]); }
    finally { setIsLoading(false); }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setHighlightIdx(-1);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(val), 250);
  };

  const navigateToSearch = (cityName?: string) => {
    const target = cityName || query.trim();
    if (target) {
      router.push(`/search?city=${encodeURIComponent(target)}`);
    } else {
      router.push('/search');
    }
  };

  const handleSelect = (city: City) => {
    setQuery(city.name);
    setShowDropdown(false);
    navigateToSearch(city.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((p) => Math.min(p + 1, cities.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((p) => Math.max(p - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && cities[highlightIdx]) {
        handleSelect(cities[highlightIdx]);
      } else {
        navigateToSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && e.target !== inputRef.current) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      {/* Three.js animated particle background — skipped on mobile for better LCP */}
      {!isMobile && <ThreeCanvas />}

      {/* Radial gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(246,71,95,0.12) 0%, transparent 70%)',
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
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: 'clamp(72px, 10vh, 140px) clamp(16px, 5vw, 40px) clamp(48px, 8vh, 100px)', maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

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
                color: '#F6475F',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F6475F', display: 'inline-block', animation: 'pulseGlow 2s infinite' }} />
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
                background: 'linear-gradient(135deg, #F6475F 20%, #FF8C94 80%)',
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
            Des milliers d&apos;annonces immobilières vérifiées à travers l&apos;Afrique. Maisons, appartements, terrains et villas — accédez aux coordonnées en toute sécurité.
          </motion.p>

          {/* CTA bar — real city autocomplete */}
          <motion.div variants={itemVariants}>
            <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto', width: '100%' }}>
              <div
                className="hero-search-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: surface,
                  border: `1px solid ${showDropdown && cities.length > 0 ? 'rgba(246,71,95,0.4)' : border}`,
                  borderRadius: showDropdown && cities.length > 0 ? '16px 16px 0 0' : 16,
                  padding: '5px 5px 5px 14px',
                  transition: 'border-color 0.2s, background 0.2s, border-radius 0.2s',
                  backdropFilter: 'blur(10px)',
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                <Search style={{ color: textMuted, fontSize: 19, flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => { if (cities.length > 0 || query.length >= 1) setShowDropdown(true); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ville, quartier..."
                  aria-label="Rechercher une ville ou un quartier"
                  role="combobox"
                  aria-expanded={showDropdown && cities.length > 0}
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-controls="hero-cities-listbox"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '10px 8px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: text,
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
                {isLoading && (
                  <div style={{ width: 16, height: 16, marginRight: 6, border: '2px solid rgba(246,71,95,0.3)', borderTopColor: '#F6475F', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
                )}
                <button
                  onClick={() => navigateToSearch()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(246,71,95,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Rechercher
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && cities.length > 0 && (
                <div
                  ref={dropdownRef}
                  role="listbox"
                  aria-label="Suggestions de villes"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: surface,
                    border: `1px solid ${border}`,
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    overflow: 'hidden',
                    zIndex: 50,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  }}
                >
                  {cities.map((city, idx) => (
                    <div
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 20px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: highlightIdx === idx ? (isDark ? 'rgba(246,71,95,0.12)' : 'rgba(246,71,95,0.06)') : 'transparent',
                      }}
                    >
                      <LocationOn style={{ fontSize: 16, color: highlightIdx === idx ? '#F6475F' : textMuted, transition: 'color 0.15s' }} />
                      <span style={{ fontSize: 14, fontWeight: highlightIdx === idx ? 600 : 400, color: highlightIdx === idx ? '#F6475F' : text, transition: 'color 0.15s' }}>
                        {city.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* City chips */}
            <div className="hero-chips">
              <span style={{ color: textMuted, fontSize: 13, alignSelf: 'center', transition: 'color 0.4s ease' }}>Populaires :</span>
              {CITIES.map((city) => (
                <Link key={city} href={`/search?city=${city.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 12px',
                      borderRadius: 100,
                    background: surface,
                    border: `1px solid ${border}`,
                    color: textSub,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(246,71,95,0.12)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,71,95,0.3)';
                      (e.currentTarget as HTMLElement).style.color = '#F6475F';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = surface;
                      (e.currentTarget as HTMLElement).style.borderColor = border;
                      (e.currentTarget as HTMLElement).style.color = textSub;
                    }}
                  >
                    <LocationOn style={{ fontSize: 12 }} />
                    {city}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={itemVariants}
            className="hero-stats"
            style={{ marginTop: 56 }}
          >
            {stats.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', opacity: statsLoaded ? 1 : 0.5, transition: 'opacity 0.5s ease, color 0.4s ease' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: text, letterSpacing: '-1px', transition: 'color 0.4s ease' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: textMuted, marginTop: 2, transition: 'color 0.4s ease' }}>{stat.label}</div>
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
          <div style={{ width: 3, height: 8, borderRadius: 2, background: textSub }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
