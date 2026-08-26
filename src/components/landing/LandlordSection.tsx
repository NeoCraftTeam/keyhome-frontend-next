'use client';

import { brandAgent, gradient, semantic } from '@/theme/tokens';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Dashboard from '@mui/icons-material/Dashboard';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

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
  const { bgAlt, text, textSub, textMuted, border } = useLandingTheme();

  return (
    <section
      id="landlords"
      className="landing-section-pad"
      style={{ background: bgAlt, transition: 'background 0.4s ease' }}
    >
      <div
        style={{ maxWidth: 1200, margin: '0 auto' }}
        className="landlord-split"
      >
        {/* Left — pitch + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: 14,
              fontWeight: 700,
              color: brandAgent.primary,
              letterSpacing: '0.2px',
              marginBottom: 14,
            }}
          >
            Propriétaires &amp; agents
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-1.2px',
              lineHeight: 1.08,
              margin: '0 0 18px',
              transition: 'color 0.4s ease',
            }}
          >
            Vous avez un bien
            <br />à louer ou vendre ?
          </h2>
          <p
            style={{
              fontSize: 17,
              color: textSub,
              lineHeight: 1.6,
              margin: '0 0 32px',
              maxWidth: 440,
            }}
          >
            Publiez votre annonce gratuitement et recevez uniquement des
            contacts sérieux. Zéro spam, zéro perte de temps.
          </p>
          <PageTransitionLink
            href="/owner/login"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            <motion.button
              whileHover={{
                y: -2,
                boxShadow: `0 10px 28px ${brandAgent.primaryAlpha25}`,
              }}
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
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 4px 18px ${brandAgent.primaryAlpha20}`,
                minHeight: 44,
              }}
            >
              Publier mon annonce
              <ArrowForward style={{ fontSize: 18 }} />
            </motion.button>
          </PageTransitionLink>
        </motion.div>
        {/* Right — benefits as an iconed list */}
        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {benefits.map((b, i) => (
            <li
              key={b.title}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                padding: '24px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${border}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: 'none',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${b.color}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <b.icon style={{ fontSize: 22, color: b.color }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: text,
                    margin: '0 0 6px',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    color: textMuted,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {b.desc}
                </p>
              </div>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
