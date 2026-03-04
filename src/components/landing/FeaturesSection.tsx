'use client';

import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';
import {
  SearchOutlined,
  LockOpenOutlined,
  PhoneEnabledOutlined,
  FavoriteBorderOutlined,
  LocationOnOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';

const features = [
  {
    icon: <SearchOutlined style={{ fontSize: 28 }} />,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
    title: 'Recherche intelligente',
    description: 'Filtrez par ville, quartier, type de bien, superficie et budget. Trouvez exactement ce que vous cherchez en quelques secondes.',
    href: '/search',
  },
  {
    icon: <LocationOnOutlined style={{ fontSize: 28 }} />,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
    title: 'Carte interactive',
    description: 'Visualisez toutes les annonces sur une carte dynamique. Explorez les quartiers et estimez les distances depuis chez vous.',
    href: '/search',
  },
  {
    icon: <LockOpenOutlined style={{ fontSize: 28 }} />,
    color: '#F6475F',
    bg: 'rgba(246,71,95,0.1)',
    border: 'rgba(246,71,95,0.2)',
    title: 'Accès sécurisé',
    description: 'Débloquez les coordonnées du propriétaire instantanément avec un micro-paiement FedaPay. 100% sécurisé et vérifié.',
    href: '/register',
  },
  {
    icon: <PhoneEnabledOutlined style={{ fontSize: 28 }} />,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
    title: 'Contact direct',
    description: 'Appelez, WhatsApp ou envoyez un email directement au propriétaire ou à l\'agence. Sans intermédiaire.',
    href: '/register',
  },
  {
    icon: <FavoriteBorderOutlined style={{ fontSize: 28 }} />,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    title: 'Favoris & alertes',
    description: 'Sauvegardez vos annonces favorites et recevez des recommandations personnalisées basées sur vos préférences.',
    href: '/register',
  },
  {
    icon: <VerifiedOutlined style={{ fontSize: 28 }} />,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.2)',
    title: 'Annonces vérifiées',
    description: 'Toutes les annonces sont modérées par notre équipe. Photos authentiques, prix cohérents et propriétaires vérifiés.',
    href: '/search',
  },
];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: EASE },
  }),
};

export default function FeaturesSection() {
  const { bg, surface, border, text, textSub } = useLandingTheme();

  return (
    <section
      id="features"
      className="landing-section-pad"
      style={{ background: bg, transition: 'background 0.4s ease' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 100,
              background: 'rgba(246,71,95,0.1)',
              border: '1px solid rgba(246,71,95,0.2)',
              color: '#F6475F',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Fonctionnalités
          </span>
          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-1.5px',
              margin: '0 0 16px',
              transition: 'color 0.4s ease',
            }}
          >
            Tout pour trouver votre logement
          </h2>
          <p style={{ fontSize: 18, color: textSub, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            Une plateforme complète pensée pour les locataires, acheteurs et bailleurs à travers l&apos;Afrique.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="features-grid">
          {features.map((f, i) => (
            <PageTransitionLink key={f.title} href={f.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <motion.div
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                style={{
                  padding: '32px',
                  borderRadius: 20,
                  background: surface,
                  border: `1px solid ${border}`,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  transition: 'border-color 0.2s, background 0.4s ease',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = f.border;
                  (e.currentTarget as HTMLElement).style.background = f.bg.replace('0.1)', '0.05)');
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = border;
                  (e.currentTarget as HTMLElement).style.background = surface;
                }}
              >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: f.color,
                  marginBottom: 24,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: text,
                  margin: '0 0 12px',
                  letterSpacing: '-0.3px',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 15, color: textSub, lineHeight: 1.65, margin: 0 }}>
                {f.description}
              </p>
            </motion.div>
            </PageTransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
