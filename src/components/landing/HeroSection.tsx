'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, LocationOn, TrendingUp, Shield, Verified } from '@mui/icons-material';
import { useLandingTheme } from './LandingThemeContext';

const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const CITIES = ['Douala', 'Yaoundé', 'Accra', 'Cotonou', 'Lomé', 'Abidjan'];

const TRUST_BADGES = [
  { icon: <Shield style={{ fontSize: 14 }} />, label: 'Paiement sécurisé' },
  { icon: <Verified style={{ fontSize: 14 }} />, label: 'Annonces vérifiées' },
  { icon: <TrendingUp style={{ fontSize: 14 }} />, label: 'Mise à jour quotidienne' },
];

export default function HeroSection() {
  const { isDark, text, textSub, textMuted, bg, surface, border } = useLandingTheme();

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
      {/* Three.js animated particle background */}
      <ThreeCanvas />

      {/* Radial gradient overlay — enhanced with dual radials for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(246,71,95,0.14) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(99,102,241,0.06) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(246,71,95,0.10) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(99,102,241,0.04) 0%, transparent 60%)',
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
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: 'clamp(80px, 10vh, 140px) 16px clamp(60px, 8vh, 100px)', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Badge */}
          <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 18px',
                borderRadius: 100,
                background: isDark ? 'rgba(246, 71, 95, 0.12)' : 'rgba(246, 71, 95, 0.08)',
                border: '1px solid rgba(246, 71, 95, 0.28)',
                color: '#F6475F',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.3px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F6475F', display: 'inline-block', animation: 'pulseGlow 2s infinite' }} />
              Plateforme immobilière #1 en Afrique
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 'clamp(40px, 7vw, 82px)',
              fontWeight: 800,
              color: text,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              margin: '0 0 24px',
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
            <br />
            <span style={{ fontSize: '0.75em', fontWeight: 700, color: textSub, letterSpacing: '-1px' }}>
              en Afrique
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

          {/* Search bar — now links to /search for immediate value */}
          <motion.div variants={itemVariants}>
            <Link
              href="/search"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="hero-search-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  padding: '6px 6px 6px 20px',
                  cursor: 'text',
                  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.3)' : '0 4px 32px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,71,95,0.5)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 32px rgba(246,71,95,0.2)';
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.95)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = border;
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 32px rgba(0,0,0,0.3)' : '0 4px 32px rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
                }}
              >
                <Search style={{ color: textMuted, fontSize: 22, flexShrink: 0 }} />
                <span style={{ flex: 1, padding: '0 12px', color: textMuted, fontSize: 15, transition: 'color 0.4s ease' }}>
                  Rechercher par ville, quartier, type de bien...
                </span>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 13,
                    padding: '13px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(246,71,95,0.45)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(246,71,95,0.55)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(246,71,95,0.45)';
                  }}
                >
                  <Search style={{ fontSize: 18 }} />
                  Rechercher
                </button>
              </div>
            </Link>

            {/* City chips — now link to /search with city query */}
            <div className="hero-chips" style={{ marginTop: 16 }}>
              <span style={{ color: textMuted, fontSize: 13, alignSelf: 'center', transition: 'color 0.4s ease' }}>Populaires :</span>
              {CITIES.map((city) => (
                <Link key={city} href={`/search?q=${encodeURIComponent(city)}`} style={{ textDecoration: 'none' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 14px',
                      borderRadius: 100,
                      background: surface,
                      border: `1px solid ${border}`,
                      color: textSub,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(4px)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(246,71,95,0.12)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,71,95,0.35)';
                      (e.currentTarget as HTMLElement).style.color = '#F6475F';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = surface;
                      (e.currentTarget as HTMLElement).style.borderColor = border;
                      (e.currentTarget as HTMLElement).style.color = textSub;
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <LocationOn style={{ fontSize: 12 }} />
                    {city}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Trust badges row */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              marginTop: 28,
              flexWrap: 'wrap',
            }}
          >
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: textMuted,
                  transition: 'color 0.4s ease',
                }}
              >
                <span style={{ color: '#10B981' }}>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            variants={itemVariants}
            className="hero-stats"
            style={{ marginTop: 52 }}
          >
            {[
              { value: '2 000+', label: 'Annonces actives' },
              { value: '10+', label: 'Pays couverts' },
              { value: '5 000+', label: 'Utilisateurs' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  textAlign: 'center',
                  padding: '16px 24px',
                  borderRadius: 16,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${border}`,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.3s ease',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 800, color: text, letterSpacing: '-1px', transition: 'color 0.4s ease' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: textMuted, marginTop: 4, transition: 'color 0.4s ease' }}>{stat.label}</div>
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
