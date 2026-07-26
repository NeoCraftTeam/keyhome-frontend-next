'use client';

import { brand, gradient, semantic } from '@/theme/tokens';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckRounded from '@mui/icons-material/CheckRounded';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function CTASection() {
  const { bgAlt, text, textSub } = useLandingTheme();
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
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(246,71,95,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          transform: 'translate(50%, -45%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 100,
              background: brand.primaryAlpha10,
              border: '1px solid rgba(246,71,95,0.2)',
              color: brand.primary,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            <PhoneIphoneOutlined style={{ fontSize: 16 }} />
            Compatible mobile &amp; tablette
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
                background: `linear-gradient(135deg, ${brand.primary}, #FF8C94)`,
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
            }}
          >
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à
            KeyHome pour leurs projets immobiliers, où qu&apos;ils soient dans
            le monde.
          </p>

          <div className="cta-buttons" style={{ marginBottom: 0 }}>
            <PageTransitionLink
              href="/search"
              style={{ textDecoration: 'none' }}
            >
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 8px 40px ${brand.primaryAlpha40}`,
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  borderRadius: 14,
                  background: gradient.primary135,
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 4px 30px ${brand.primaryAlpha40}`,
                  letterSpacing: '-0.3px',
                  minHeight: 44,
                }}
              >
                Voir les annonces
                <ArrowForward style={{ fontSize: 20 }} />
              </motion.button>
            </PageTransitionLink>

            <PageTransitionLink
              href="/owner/login"
              style={{ textDecoration: 'none' }}
            >
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 8px 40px ${brand.primaryAlpha40}`,
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  borderRadius: 14,
                  background: brand.primary,
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '-0.3px',
                  minHeight: 44,
                  boxShadow: `0 4px 30px ${brand.primaryAlpha30}`,
                }}
              >
                Publier une annonce
              </motion.button>
            </PageTransitionLink>
          </div>

          {/* Trust badges */}
          <ul
            aria-label="Garanties KeyHome"
            style={{
              marginTop: 52,
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
              listStyle: 'none',
              padding: 0,
            }}
          >
            {[
              'Inscription gratuite',
              'Paiement sécurisé',
              'Support local',
              'Sans engagement',
            ].map((badge) => (
              <li
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: textSub,
                }}
              >
                <CheckRounded
                  aria-hidden
                  style={{ color: semantic.successBright, fontSize: 16 }}
                />
                {badge}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
