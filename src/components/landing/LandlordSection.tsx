'use client';

import { motion } from 'framer-motion';
import Dashboard from '@mui/icons-material/Dashboard';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';
import { brandAgent, gradient, semantic } from '@/theme/tokens';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const benefits = [
  {
    icon: Dashboard,
    title: 'Tableau de bord complet',
    desc: 'Gérez toutes vos annonces, consultez les statistiques et suivez les contacts depuis un seul endroit.',
    color: brandAgent.primary,
  },
  {
    icon: PeopleOutline,
    title: 'Contacts qualifiés uniquement',
    desc: 'Seuls les locataires et acheteurs sérieux — ayant investi des crédits — peuvent accéder à vos coordonnées.',
    color: semantic.successBright,
  },
  {
    icon: VerifiedUser,
    title: 'Annonces vérifiées',
    desc: 'Votre profil vérifié inspire confiance. Publiez en quelques minutes et touchez des milliers de chercheurs.',
    color: semantic.purple,
  },
];

export default function LandlordSection() {
  const { bgAlt, text, textSub, textMuted, surface, border } =
    useLandingTheme();

  return (
    <section
      id="landlords"
      className="landing-section-pad"
      style={{ background: bgAlt, transition: 'background 0.4s ease' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 100,
              background: brandAgent.primaryAlpha10,
              border: `1px solid ${brandAgent.primaryAlpha20}`,
              color: brandAgent.primary,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Propriétaires & Agents
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-1.2px',
              margin: '0 0 16px',
              transition: 'color 0.4s ease',
            }}
          >
            Vous avez un bien à louer ou vendre ?
          </h2>
          <p
            style={{
              fontSize: 17,
              color: textSub,
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Publiez votre annonce gratuitement et recevez uniquement des
            contacts sérieux. Zéro spam, zéro perte de temps.
          </p>
        </motion.div>

        {/* Benefits cards */}
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 48,
            listStyle: 'none',
            padding: 0,
          }}
        >
          {benefits.map((b, i) => (
            <motion.li
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              style={{
                padding: 28,
                borderRadius: 20,
                background: surface,
                border: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${b.color}15`,
                  border: `1px solid ${b.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <b.icon style={{ fontSize: 22, color: b.color }} />
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: text,
                  margin: 0,
                }}
              >
                {b.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: textMuted,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {b.desc}
              </p>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ textAlign: 'center' }}
        >
          <PageTransitionLink
            href="/owner/login"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: gradient.agent,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${brandAgent.primaryAlpha20}`,
                minHeight: 44,
              }}
            >
              Publier mon annonce
              <ArrowForward style={{ fontSize: 18 }} />
            </motion.button>
          </PageTransitionLink>
        </motion.div>
      </div>
    </section>
  );
}
