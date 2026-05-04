'use client';

import { brand, semantic } from '@/theme/tokens';
import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import CallOutlined from '@mui/icons-material/CallOutlined';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const steps = [
  {
    icon: <PersonAddOutlined style={{ fontSize: 26 }} />,
    color: brand.primary,
    title: 'Créez votre compte',
    description:
      'Inscription gratuite en 30 secondes. Aucune carte bancaire requise pour parcourir les annonces.',
  },
  {
    icon: <TravelExploreOutlined style={{ fontSize: 26 }} />,
    color: semantic.info,
    title: 'Explorez les annonces',
    description:
      'Naviguez par catégorie, filtrez par budget et localisation. Consultez les photos et les détails complets.',
  },
  {
    icon: <LockOpenOutlined style={{ fontSize: 26 }} />,
    color: semantic.successBright,
    title: 'Accès direct & sécurisé',
    description:
      'Payez un petit montant unique via Mobile Money pour accéder aux coordonnées. Zéro commission, 100% direct.',
  },
  {
    icon: <CallOutlined style={{ fontSize: 26 }} />,
    color: semantic.purple,
    title: 'Contactez directement',
    description:
      'Appelez, envoyez un WhatsApp ou un email. Organisez votre visite et finalisez votre projet immobilier.',
  },
];

export default function HowItWorksSection() {
  const { bgAlt, gridLine, border, text, textSub } = useLandingTheme();
  return (
    <section
      id="how-it-works"
      className="landing-section-pad"
      style={{
        background: bgAlt,
        transition: 'background 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid bg */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${gridLine} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

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
          style={{ textAlign: 'center', marginBottom: 80 }}
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
            Comment ça marche
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
            Simple, rapide, sécurisé
          </h2>
          <p
            style={{
              fontSize: 18,
              color: textSub,
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            De l&apos;inscription au premier contact en moins de 5 minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <ol
          className="steps-grid"
          style={{
            position: 'relative',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {/* Desktop connector — single dashed line behind icons */}
          <div
            aria-hidden
            className="steps-connector"
            style={{
              position: 'absolute',
              top: 36,
              left: '12.5%',
              right: '12.5%',
              height: 1,
              backgroundImage: `linear-gradient(90deg, ${border} 0 8px, transparent 8px 16px)`,
              backgroundSize: '16px 1px',
              backgroundRepeat: 'repeat-x',
              zIndex: 0,
            }}
          />

          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: EASE }}
              style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Step icon arc with sequential number badge */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${step.color}22, ${bgAlt} 80%)`,
                    border: `1px solid ${step.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                    margin: '0 auto',
                  }}
                >
                  {step.icon}
                </div>
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: step.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  {i + 1}
                </div>
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: text,
                  margin: '0 0 12px',
                  transition: 'color 0.4s ease',
                  letterSpacing: '-0.3px',
                }}
              >
                <span className="sr-only">Étape {i + 1} : </span>
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: textSub,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
