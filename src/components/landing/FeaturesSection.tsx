'use client';

import { brand, semantic } from '@/theme/tokens';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import PhoneEnabledOutlined from '@mui/icons-material/PhoneEnabledOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ThreeSixtyOutlined from '@mui/icons-material/ThreeSixtyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

/** Returns matching alpha overlay tones for a brand/semantic accent. */
function tones(color: string): { bg: string; border: string; bgHover: string } {
  return {
    bg: `${color}1A`, //  ~10%
    bgHover: `${color}26`, // ~15%
    border: `${color}33`, // ~20%
  };
}

const features = [
  {
    icon: <SearchOutlined style={{ fontSize: 28 }} />,
    color: semantic.info,
    title: 'Recherche intelligente',
    description:
      'Filtrez par ville, quartier, type de bien, superficie et budget. Trouvez exactement ce que vous cherchez en quelques secondes.',
    href: '/search',
  },
  {
    icon: <LocationOnOutlined style={{ fontSize: 28 }} />,
    color: semantic.successBright,
    title: 'Carte interactive',
    description:
      'Visualisez toutes les annonces sur une carte dynamique. Explorez les quartiers et estimez les distances depuis chez vous.',
    href: '/search',
  },
  {
    icon: <LockOpenOutlined style={{ fontSize: 28 }} />,
    color: brand.primary,
    title: 'Accès sécurisé',
    description:
      'Débloquez les coordonnées du propriétaire instantanément avec un micro-paiement sécurisé. 100% vérifié.',
    href: '/register',
  },
  {
    icon: <PhoneEnabledOutlined style={{ fontSize: 28 }} />,
    color: semantic.purple,
    title: 'Contact direct',
    description:
      "Appelez, WhatsApp ou envoyez un email directement au propriétaire ou à l'agence. Sans intermédiaire.",
    href: '/register',
  },
  {
    icon: <FavoriteBorderOutlined style={{ fontSize: 28 }} />,
    color: semantic.warning,
    title: 'Favoris & alertes',
    description:
      'Sauvegardez vos annonces favorites et recevez des recommandations personnalisées basées sur vos préférences.',
    href: '/register',
  },
  {
    icon: <VerifiedOutlined style={{ fontSize: 28 }} />,
    color: '#06B6D4', // cyan accent — no semantic token, kept for variety
    title: 'Annonces vérifiées',
    description:
      'Toutes les annonces sont modérées par notre équipe. Photos authentiques, prix cohérents et propriétaires vérifiés.',
    href: '/search',
  },
  {
    icon: <ThreeSixtyOutlined style={{ fontSize: 28 }} />,
    color: semantic.purple,
    title: 'Visites virtuelles 3D',
    description:
      'Explorez les biens depuis chez vous grâce aux visites immersives 360°. Gagnez du temps avant chaque déplacement sur le terrain.',
    href: '/search',
  },
  {
    icon: <DescriptionOutlined style={{ fontSize: 28 }} />,
    color: semantic.successBright,
    title: 'Contrats de location',
    description:
      "Signez vos baux en ligne directement depuis la plateforme. Modèles légaux prêts à l'emploi, signés et archivés en toute sécurité.",
    href: '/owner/login',
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
          transition={{ duration: 0.7, ease: EASE }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 100,
              background: brand.primaryAlpha10,
              border: `1px solid ${brand.primaryAlpha30}`,
              color: brand.primary,
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
          <p
            style={{
              fontSize: 18,
              color: textSub,
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Une plateforme complète pensée pour les locataires, acheteurs et
            bailleurs, où qu&apos;ils soient.
          </p>
        </motion.div>

        {/* Cards grid */}
        <ul
          className="features-grid"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {features.map((f, i) => {
            const t = tones(f.color);
            return (
              <li key={f.title} style={{ display: 'flex' }}>
                <PageTransitionLink
                  href={f.href}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    width: '100%',
                  }}
                >
                  <motion.article
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                    style={{
                      padding: '32px',
                      borderRadius: 20,
                      background: surface,
                      border: `1px solid ${border}`,
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                      transition: 'border-color 0.25s, background 0.25s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        t.border;
                      (e.currentTarget as HTMLElement).style.background =
                        t.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        border;
                      (e.currentTarget as HTMLElement).style.background =
                        surface;
                    }}
                  >
                    <div
                      aria-hidden
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: t.bg,
                        border: `1px solid ${t.border}`,
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
                    <p
                      style={{
                        fontSize: 15,
                        color: textSub,
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {f.description}
                    </p>
                  </motion.article>
                </PageTransitionLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
