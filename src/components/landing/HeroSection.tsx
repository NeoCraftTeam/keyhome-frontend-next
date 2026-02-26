'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, LocationOn } from '@mui/icons-material';
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

const CITIES = ['Douala', 'Garoua', 'Accra', 'Cotonou', 'Lomé', 'Bafoussam'];

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
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: 'clamp(80px, 10vh, 140px) 16px clamp(60px, 8vh, 100px)', maxWidth: 860, width: '100%', margin: '0 auto' }}>
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
              Plateforme immobilière #1 en Afrique
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 'clamp(40px, 7vw, 80px)',
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

          {/* Fake search bar */}
          <motion.div variants={itemVariants}>
            <Link
              href="/register"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="hero-search-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: 16,
                  padding: '6px 6px 6px 20px',
                  cursor: 'text',
                  transition: 'border-color 0.2s, background 0.2s',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,71,95,0.4)';
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = border;
                  (e.currentTarget as HTMLElement).style.background = surface;
                }}
              >
                <Search style={{ color: textMuted, fontSize: 22, flexShrink: 0 }} />
                <span style={{ flex: 1, padding: '0 12px', color: textMuted, fontSize: 15, transition: 'color 0.4s ease' }}>
                  Rechercher une annonce...
                </span>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 22px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(246,71,95,0.4)',
                  }}
                >
                  <Search style={{ fontSize: 18 }} />
                  Rechercher
                </button>
              </div>
            </Link>

            {/* City chips */}
            <div className="hero-chips">
              <span style={{ color: textMuted, fontSize: 13, alignSelf: 'center', transition: 'color 0.4s ease' }}>Populaires :</span>
              {CITIES.map((city) => (
                <Link key={city} href="/register" style={{ textDecoration: 'none' }}>
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
            {[
              { value: '2 000+', label: 'Annonces actives' },
              { value: '10+', label: 'Pays couverts' },
              { value: '5 000+', label: 'Utilisateurs' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
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
