'use client';

import { brand, semantic } from '@/theme/tokens';
import ArrowForward from '@mui/icons-material/ArrowForward';
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

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** The flagship promise — pulled out of the grid into a lead banner. */
const lead = {
  icon: <LockOpenOutlined style={{ fontSize: 32 }} />,
  title: 'Accès direct au propriétaire',
  description:
    'Débloquez les coordonnées vérifiées du propriétaire avec un micro-paiement sécurisé. Appelez, WhatsApp ou email — sans agence, sans commission, sans intermédiaire.',
  href: '/register',
};

const features = [
  {
    icon: <SearchOutlined style={{ fontSize: 24 }} />,
    color: semantic.info,
    title: 'Recherche intelligente',
    description:
      'Filtrez par ville, quartier, type de bien, superficie et budget. Trouvez exactement ce que vous cherchez en quelques secondes.',
    href: '/search',
  },
  {
    icon: <LocationOnOutlined style={{ fontSize: 24 }} />,
    color: semantic.successBright,
    title: 'Carte interactive',
    description:
      'Visualisez toutes les annonces sur une carte dynamique. Explorez les quartiers et estimez les distances depuis chez vous.',
    href: '/search',
  },
  {
    icon: <PhoneEnabledOutlined style={{ fontSize: 24 }} />,
    color: semantic.purple,
    title: 'Contact direct',
    description:
      "Appelez, WhatsApp ou envoyez un email directement au propriétaire ou à l'agence. Sans intermédiaire.",
    href: '/register',
  },
  {
    icon: <FavoriteBorderOutlined style={{ fontSize: 24 }} />,
    color: semantic.warning,
    title: 'Favoris & alertes',
    description:
      'Sauvegardez vos annonces favorites et recevez des recommandations personnalisées basées sur vos préférences.',
    href: '/register',
  },
  {
    icon: <VerifiedOutlined style={{ fontSize: 24 }} />,
    color: '#06B6D4', // cyan accent — no semantic token, kept for variety
    title: 'Annonces vérifiées',
    description:
      'Toutes les annonces sont modérées par notre équipe. Photos authentiques, prix cohérents et propriétaires vérifiés.',
    href: '/search',
  },
  {
    icon: <ThreeSixtyOutlined style={{ fontSize: 24 }} />,
    color: semantic.purple,
    title: 'Visites virtuelles 3D',
    description:
      'Explorez les biens depuis chez vous grâce aux visites immersives 360°. Gagnez du temps avant chaque déplacement sur le terrain.',
    href: '/search',
  },
  {
    icon: <DescriptionOutlined style={{ fontSize: 24 }} />,
    color: semantic.successBright,
    title: 'Contrats de location',
    description:
      "Signez vos baux en ligne directement depuis la plateforme. Modèles légaux prêts à l'emploi, signés et archivés en toute sécurité.",
    href: '/owner/login',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: EASE },
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
        {/* Asymmetric header — heading left, supporting line right */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 48,
          }}
        >
          <h2
            style={{
              flex: '1 1 440px',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
              margin: 0,
              transition: 'color 0.4s ease',
            }}
          >
            Tout pour trouver
            <br />
            votre logement
          </h2>
          <p
            style={{
              flex: '0 1 360px',
              fontSize: 17,
              color: textSub,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Une plateforme complète pensée pour les locataires, acheteurs et
            bailleurs, où qu&apos;ils soient.
          </p>
        </motion.div>
        {/* Flagship promise — lead banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ marginBottom: 24 }}
        >
          <PageTransitionLink
            href={lead.href}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <motion.article
              className="features-lead"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{
                padding: 'clamp(28px, 4vw, 44px)',
                borderRadius: 24,
                background: `linear-gradient(120deg, ${brand.primaryAlpha10}, ${surface} 60%)`,
                border: `1px solid ${brand.primaryAlpha30}`,
                cursor: 'pointer',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = brand.primary;
                el.style.boxShadow = `0 22px 50px ${brand.primaryAlpha25}`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = brand.primaryAlpha30;
                el.style.boxShadow = 'none';
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: 'none',
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: brand.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 10px 30px ${brand.primaryAlpha40}`,
                }}
              >
                {lead.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: 'clamp(22px, 3vw, 28px)',
                    fontWeight: 800,
                    color: text,
                    letterSpacing: '-0.6px',
                    margin: '0 0 10px',
                  }}
                >
                  {lead.title}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    color: textSub,
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: 640,
                  }}
                >
                  {lead.description}
                </p>
              </div>
              <span
                style={{
                  flex: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: brand.primary,
                  fontSize: 15,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Commencer
                <ArrowForward style={{ fontSize: 18 }} />
              </span>
            </motion.article>
          </PageTransitionLink>
        </motion.div>
        {/* Supporting features — inline icon, de-boxed */}
        <ul
          className="features-grid"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {features.map((f, i) => (
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
                    padding: '28px',
                    borderRadius: 16,
                    background: surface,
                    border: `1px solid ${border}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = f.color;
                    el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = border;
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        flex: 'none',
                        display: 'inline-flex',
                        color: f.color,
                      }}
                    >
                      {f.icon}
                    </span>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: text,
                        margin: 0,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {f.title}
                    </h3>
                  </div>
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
          ))}
        </ul>
      </div>
    </section>
  );
}
