'use client';

import { motion } from 'framer-motion';
import { ArrowForward, PhoneIphoneOutlined, Search } from '@mui/icons-material';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

export default function CTASection() {
  const { bgAlt, text, textSub, surface, surfaceHover, border, textMuted } = useLandingTheme();
  return (
    <section
      className="landing-section-pad"
      style={{
        background: bgAlt,
        transition: 'background 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '20%',
          transform: 'translate(-50%, -55%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,71,95,0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          transform: 'translate(50%, -45%)',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 100,
              background: 'rgba(246,71,95,0.1)',
              border: '1px solid rgba(246,71,95,0.2)',
              color: '#F6475F',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            <PhoneIphoneOutlined style={{ fontSize: 16 }} />
            Disponible sur mobile
          </div>

          <h2
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-2px',
              transition: 'color 0.4s ease',
              margin: '0 0 24px',
              lineHeight: 1.05,
            }}
          >
            Prêt à trouver votre{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #F6475F, #FF8C94)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nouveau chez-vous ?
            </span>
          </h2>

          <p
            style={{
              fontSize: 18,
              color: textSub,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: '0 auto 48px',
              transition: 'color 0.4s ease',
            }}
          >
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à KeyHome pour leurs projets immobiliers à travers l&apos;Afrique.
          </p>

          <div className="cta-buttons" style={{ marginBottom: 0 }}>
            {/* Primary CTA: explore first, register later */}
            <PageTransitionLink href="/search" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 8px 40px rgba(246,71,95,0.6)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 30px rgba(246,71,95,0.4)',
                  letterSpacing: '-0.3px',
                }}
              >
                <Search style={{ fontSize: 20 }} />
                Explorer les annonces
              </motion.button>
            </PageTransitionLink>

            {/* Secondary CTA: create account */}
            <PageTransitionLink href="/register" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.03, background: surfaceHover }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  borderRadius: 14,
                  background: surface,
                  color: text,
                  fontSize: 17,
                  fontWeight: 600,
                  border: `1px solid ${border}`,
                  cursor: 'pointer',
                  letterSpacing: '-0.3px',
                  transition: 'background 0.2s',
                }}
              >
                Créer un compte gratuit
                <ArrowForward style={{ fontSize: 18 }} />
              </motion.button>
            </PageTransitionLink>
          </div>

          {/* Trust badges */}
          <div
            style={{
              marginTop: 52,
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {['Inscription gratuite', 'Paiement sécurisé', 'Support local', 'Sans engagement'].map((badge) => (
              <span
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: textMuted,
                  transition: 'color 0.4s ease',
                }}
              >
                <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
