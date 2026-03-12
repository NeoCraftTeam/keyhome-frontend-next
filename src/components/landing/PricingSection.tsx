'use client';

import { creditsService } from '@/services/credits.service';
import { PointPackage } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import { CheckCircleRounded, Toll, LocalFireDepartment, CreditCard, HelpOutline } from '@mui/icons-material';
import { PageTransitionLink } from './PageTransition';
import { Tooltip } from '@mui/material';

type LandingPackageCard = {
  id: string;
  name: string;
  points: number;
  price: string;
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
    price: '1 000',
    description: 'Débloquez vos premiers contacts propriétaires vérifiés pour lancer votre recherche.',
    features: ['10 déverrouillages de contacts', 'Accès direct aux numéros et WhatsApp', 'Historique des annonces déverrouillées'],
    badge: 'Essai',
    sortOrder: 1,
  },
  {
    id: 'fallback-standard',
    name: 'Standard',
    points: 50,
    price: '4 000',
    description: 'Le pack équilibré pour comparer plus d’annonces et contacter rapidement les bons propriétaires.',
    features: ['50 déverrouillages de contacts', 'Accès direct aux numéros et WhatsApp', 'Priorité de traitement support', 'Meilleur ratio coût/contact'],
    badge: 'Populaire',
    isPopular: true,
    sortOrder: 2,
  },
  {
    id: 'fallback-premium',
    name: 'Premium',
    points: 120,
    price: '10 000',
    description: 'Conçu pour les chercheurs intensifs et pros qui veulent traiter un grand volume d’annonces.',
    features: ['120 déverrouillages de contacts', 'Accès direct aux numéros et WhatsApp', 'Support prioritaire', 'Volume optimisé pour pros'],
    badge: 'Expert',
    sortOrder: 3,
  },
];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatFcfa = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount);
};

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
  return [
    `${points} déverrouillages de contacts`,
    'Accès direct aux numéros et WhatsApp des propriétaires',
    'Historique des annonces déverrouillées',
  ];
};

const mapApiPackageToCard = (pkg: PointPackage): LandingPackageCard => {
  const trimmedDescription = pkg.description?.trim() ?? '';
  const cleanedFeatures = (pkg.features ?? []).map((feature) => feature.trim()).filter(Boolean);
  const normalizedName = normalizeName(pkg.name);

  return {
    id: pkg.id,
    name: normalizedName || pkg.name,
    points: pkg.points_awarded,
    price: formatFcfa(pkg.price),
    description: trimmedDescription || defaultDescription(pkg.points_awarded),
    features: cleanedFeatures.length > 0 ? cleanedFeatures : defaultFeatures(pkg.points_awarded),
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

  const packages = apiPackages.length > 0
    ? [...apiPackages]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapApiPackageToCard)
    : fallbackPackages;

  return (
    <section
      id="pricing"
      className="landing-section-pad"
      style={{ background: bg, transition: 'background 0.4s ease', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

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
              background: 'rgba(246,71,95,0.1)',
              border: '1px solid rgba(246,71,95,0.2)',
              color: '#F6475F',
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
          <p style={{ fontSize: 18, color: textSub, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
            Pas d&apos;abonnement caché, pas de commission sur le loyer. Achetez des crédits et déverrouillez les annonces qui vous intéressent.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="pricing-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32,
          alignItems: 'stretch'
        }}>
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: EASE }}
              style={{
                background: pkg.isPopular
                  ? 'linear-gradient(145deg, #F6475F 0%, #D93A50 100%)'
                  : surface,
                border: pkg.isPopular ? 'none' : `1px solid ${border}`,
                borderRadius: 24,
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: pkg.isPopular ? '0 20px 40px rgba(246,71,95,0.25)' : 'none',
                overflow: 'hidden',
                transition: 'background 0.4s ease, border-color 0.4s ease',
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: 24,
                right: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 100,
                background: pkg.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(246,71,95,0.1)',
                color: pkg.isPopular ? '#fff' : '#F6475F',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {pkg.isPopular ? <LocalFireDepartment style={{ fontSize: 14 }} /> : <Toll style={{ fontSize: 14 }} />}
                {pkg.badge}
              </div>

              <h3 style={{
                fontSize: 24,
                fontWeight: 800,
                color: pkg.isPopular ? '#fff' : text,
                margin: '0 0 8px',
                letterSpacing: '-0.5px'
              }}>
                {pkg.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                <span style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: pkg.isPopular ? '#fff' : text,
                  letterSpacing: '-1.5px'
                }}>
                  {pkg.price}
                </span>
                <span style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: pkg.isPopular ? 'rgba(255,255,255,0.7)' : textSub
                }}>
                  FCFA
                </span>
              </div>

              <p style={{
                fontSize: 15,
                color: pkg.isPopular ? 'rgba(255,255,255,0.85)' : textMuted,
                lineHeight: 1.6,
                marginBottom: 32,
                minHeight: 48
              }}>
                {pkg.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flex: 1 }}>
                {pkg.features.map((feat) => (
                  <div key={`${pkg.id}-${feat}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircleRounded style={{
                      fontSize: 18,
                      color: pkg.isPopular ? '#fff' : '#10B981'
                    }} />
                    <span style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: pkg.isPopular ? 'rgba(255,255,255,0.9)' : textSub
                    }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <PageTransitionLink href="/register" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 14,
                    background: pkg.isPopular ? '#fff' : '#F6475F',
                    color: pkg.isPopular ? '#F6475F' : '#fff',
                    border: 'none',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: pkg.isPopular ? '0 10px 20px rgba(0,0,0,0.1)' : '0 10px 20px rgba(246,71,95,0.2)',
                  }}
                >
                  Choisir ce pack
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
            margin: '64px auto 0'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard style={{ color: '#F6475F' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: textSub }}>Mobile Money (Orange, MTN, Wave, Moov...)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#10B981', fontWeight: 800 }}>0%</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: textSub }}>Frais de commission d&apos;agence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tooltip title="Chaque annonce déverrouillée reste accessible à vie dans votre compte.">
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
                   <span style={{ fontSize: 14, fontWeight: 600, color: textSub }}>Accès à vie</span>
                   <HelpOutline style={{ fontSize: 14, color: textMuted }} />
                 </div>
              </Tooltip>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
