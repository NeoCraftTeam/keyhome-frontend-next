'use client';

import { Price } from '@/components/ui/typography/Price';
import { creditsService } from '@/services/credits.service';
import { brand, semantic } from '@/theme/tokens';
import { PointPackage } from '@/types';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CreditCard from '@mui/icons-material/CreditCard';
import HelpOutline from '@mui/icons-material/HelpOutline';
import HomeWorkOutlined from '@mui/icons-material/HomeWorkOutlined';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Toll from '@mui/icons-material/Toll';
import { Tooltip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { PageTransitionLink } from './PageTransition';

type LandingPackageCard = {
  id: string;
  name: string;
  points: number;
  /** Canonical price in XAF (FCFA) — converted at render via <Price>. */
  priceXaf: number;
  description: string;
  features: string[];
  badge: string;
  isPopular?: boolean;
  sortOrder: number;
};

const fallbackPackages: LandingPackageCard[] = [
  {
    id: 'fallback-starter',
    name: 'Starter',
    points: 10,
    priceXaf: 1000,
    description:
      'Testez KeyHome sans risque. Contactez 5 propriétaires vérifiés — numéro et WhatsApp inclus — sans passer par une agence.',
    features: [
      '5 annonces propriétaires débloqués (2 crédits/annonce)',
      'Appelez ou WhatsApp le propriétaire directement',
      'Zéro commission, zéro intermédiaire',
    ],
    badge: 'Essai',
    sortOrder: 1,
  },
  {
    id: 'fallback-standard',
    name: 'Standard',
    points: 50,
    priceXaf: 4000,
    description:
      'Le choix des chercheurs actifs. 25 propriétaires en accès direct — assez pour trouver avant vos concurrents.',
    features: [
      '25 annonces propriétaires débloqués',
      'Économisez 20 % par contact vs Starter',
      'Appel + WhatsApp + messagerie KeyHome',
      'Support prioritaire inclus',
    ],
    badge: 'Populaire',
    isPopular: true,
    sortOrder: 2,
  },
  {
    id: 'fallback-premium',
    name: 'Premium',
    points: 120,
    priceXaf: 7000,
    description:
      'Pour les familles ambitieuses et les pros en mobilité. 60 contacts sur 12 mois — le meilleur coût par logement trouvé.',
    features: [
      '60 annonces propriétaires débloqués',
      '42 % de réduction par contact vs Starter',
      'Appel + WhatsApp + messagerie KeyHome',
      'Support 24h/7j · Crédits valables 12 mois',
    ],
    badge: 'Expert',
    sortOrder: 3,
  },
];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const normalizeName = (name: string): string => {
  return name.replace(/^pack\s+/i, '').trim();
};

const defaultDescription = (points: number): string => {
  if (points <= 20) {
    return 'Parfait pour tester KeyHome et débloquer vos premiers contacts propriétaires.';
  }

  if (points <= 80) {
    return 'Idéal pour accélérer votre recherche et multiplier les prises de contact qualifiées.';
  }

  return 'Pensé pour les utilisateurs intensifs et équipes qui traitent beaucoup d’annonces.';
};

const defaultFeatures = (points: number): string[] => {
  const contacts = Math.round(points / 2);
  return [
    `${contacts} contacts propriétaires débloqués`,
    'Appel + WhatsApp direct, sans intermédiaire',
    'Zéro commission',
  ];
};

const mapApiPackageToCard = (pkg: PointPackage): LandingPackageCard => {
  const trimmedDescription = pkg.description?.trim() ?? '';
  const cleanedFeatures = (pkg.features ?? [])
    .map((feature) => feature.trim())
    .filter(Boolean);
  const normalizedName = normalizeName(pkg.name);

  return {
    id: pkg.id,
    name: normalizedName || pkg.name,
    points: pkg.points_awarded,
    priceXaf: pkg.price,
    description: trimmedDescription || defaultDescription(pkg.points_awarded),
    features:
      cleanedFeatures.length > 0
        ? cleanedFeatures
        : defaultFeatures(pkg.points_awarded),
    badge: pkg.badge?.trim() || (pkg.is_popular ? 'Populaire' : 'Crédits'),
    isPopular: pkg.is_popular,
    sortOrder: pkg.sort_order ?? 0,
  };
};

export default function PricingSection() {
  const { bg, surface, border, text, textSub, textMuted } = useLandingTheme();
  const { data: apiPackages = [] } = useQuery({
    queryKey: ['landing-credit-packages'],
    queryFn: creditsService.listPackages,
  });

  const packages =
    apiPackages.length > 0
      ? [...apiPackages]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(mapApiPackageToCard)
      : fallbackPackages;

  return (
    <section
      id="pricing"
      className="landing-section-pad"
      style={{
        background: bg,
        transition: 'background 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
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
              background: brand.primaryAlpha10,
              border: `1px solid ${brand.primaryAlpha30}`,
              color: brand.primary,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Tarification simple
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
            Payez uniquement pour le contact
          </h2>
          <p
            style={{
              fontSize: 18,
              color: textSub,
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Pas d&apos;abonnement caché, pas de commission sur le loyer. Achetez
            des crédits et déverrouillez les annonces qui vous intéressent.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div
          className="pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
            alignItems: 'stretch',
          }}
        >
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: EASE }}
              style={{
                background: pkg.isPopular
                  ? `linear-gradient(145deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`
                  : surface,
                border: pkg.isPopular ? 'none' : `1px solid ${border}`,
                borderRadius: 24,
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: pkg.isPopular
                  ? '0 20px 40px rgba(246,71,95,0.25)'
                  : 'none',
                overflow: 'hidden',
                transition: 'background 0.4s ease, border-color 0.4s ease',
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: pkg.isPopular
                    ? 'rgba(255,255,255,0.2)'
                    : brand.primaryAlpha10,
                  color: pkg.isPopular ? '#fff' : brand.primary,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {pkg.isPopular ? (
                  <LocalFireDepartment style={{ fontSize: 14 }} />
                ) : (
                  <Toll style={{ fontSize: 14 }} />
                )}
                {pkg.badge}
              </div>

              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: pkg.isPopular ? '#fff' : text,
                  margin: '0 0 8px',
                  letterSpacing: '-0.5px',
                }}
              >
                {pkg.name}
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: 16,
                  fontSize: 48,
                  fontWeight: 900,
                  color: pkg.isPopular ? '#fff' : text,
                  letterSpacing: '-1.5px',
                  lineHeight: 1.05,
                }}
              >
                <Price amountXAF={pkg.priceXaf} showOriginal />
              </div>

              <p
                style={{
                  fontSize: 15,
                  color: pkg.isPopular ? 'rgba(255,255,255,0.85)' : textMuted,
                  lineHeight: 1.6,
                  marginBottom: 32,
                  minHeight: 48,
                }}
              >
                {pkg.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  marginBottom: 40,
                  flex: 1,
                }}
              >
                {pkg.features.map((feat) => (
                  <div
                    key={`${pkg.id}-${feat}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <CheckCircleRounded
                      style={{
                        fontSize: 18,
                        color: pkg.isPopular ? '#fff' : semantic.successBright,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: pkg.isPopular
                          ? 'rgba(255,255,255,0.9)'
                          : textSub,
                      }}
                    >
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <PageTransitionLink
                href="/register"
                style={{ textDecoration: 'none' }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  aria-label={`Choisir le pack ${pkg.name}`}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 14,
                    background: pkg.isPopular ? '#fff' : brand.primary,
                    color: pkg.isPopular ? brand.primary : '#fff',
                    border: 'none',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: 44,
                    boxShadow: pkg.isPopular
                      ? '0 10px 20px rgba(0,0,0,0.1)'
                      : `0 10px 20px ${brand.primaryAlpha25}`,
                  }}
                >
                  Je démarre maintenant →
                </motion.button>
              </PageTransitionLink>
            </motion.div>
          ))}
        </div>

        {/* Comparison Note / Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{
            marginTop: 64,
            textAlign: 'center',
            padding: '24px',
            borderRadius: 20,
            background: surface,
            border: `1px solid ${border}`,
            maxWidth: 800,
            margin: '64px auto 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard style={{ color: brand.primary }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: textSub }}>
                Mobile Money (Orange, MTN, Wave, Moov...)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: semantic.successBright, fontWeight: 800 }}>
                0%
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: textSub }}>
                Frais de commission d&apos;agence
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tooltip title="Chaque annonce déverrouillée reste accessible à vie dans votre compte.">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'help',
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: textSub }}
                  >
                    Accès à vie
                  </span>
                  <HelpOutline style={{ fontSize: 14, color: textMuted }} />
                </div>
              </Tooltip>
            </div>
          </div>
        </motion.div>

        {/* Bailleur block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          style={{
            marginTop: 48,
            borderRadius: 24,
            border: `1.5px solid ${brand.primaryAlpha25}`,
            background: brand.primaryAlpha10,
            padding: '40px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: brand.primaryAlpha15,
                border: `1px solid ${brand.primaryAlpha30}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brand.primary,
                flexShrink: 0,
              }}
            >
              <HomeWorkOutlined style={{ fontSize: 26 }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: brand.primary,
                  margin: '0 0 8px',
                  letterSpacing: '-0.5px',
                }}
              >
                Vous êtes bailleur ou agence ?
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: textSub,
                  margin: 0,
                  lineHeight: 1.6,
                  maxWidth: 520,
                }}
              >
                Publiez vos annonces gratuitement et recevez des contacts
                sérieux directement depuis votre tableau de bord. Sans
                commission, sans intermédiaire.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 16,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  'Publication gratuite',
                  'Tableau de bord bailleur',
                  'Contacts vérifiés',
                  'Boost de visibilité',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: textSub,
                    }}
                  >
                    <CheckCircleRounded
                      style={{ fontSize: 15, color: semantic.successBright }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PageTransitionLink
            href="/owner/login"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: `0 8px 30px ${brand.primaryAlpha40}`,
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 28px',
                borderRadius: 14,
                background: brand.primary,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                minHeight: 44,
                boxShadow: `0 4px 20px ${brand.primaryAlpha30}`,
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              Publier une annonce →
            </motion.button>
          </PageTransitionLink>
        </motion.div>
      </div>
    </section>
  );
}
