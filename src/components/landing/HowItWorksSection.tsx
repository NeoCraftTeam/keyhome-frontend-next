'use client';

import { motion } from 'framer-motion';
import { useLandingTheme } from './LandingThemeContext';
import {
  PersonAddOutlined,
  TravelExploreOutlined,
  LockOpenOutlined,
  CallOutlined,
} from '@mui/icons-material';

const steps = [
  {
    number: '01',
    icon: <PersonAddOutlined style={{ fontSize: 26 }} />,
    color: '#F6475F',
    title: 'Créez votre compte',
    description: 'Inscription gratuite en 30 secondes. Aucune carte bancaire requise pour parcourir les annonces.',
  },
  {
    number: '02',
    icon: <TravelExploreOutlined style={{ fontSize: 26 }} />,
    color: '#3B82F6',
    title: 'Explorez les annonces',
    description: 'Naviguez par catégorie, filtrez par budget et localisation. Consultez les photos et les détails complets.',
  },
  {
    number: '03',
    icon: <LockOpenOutlined style={{ fontSize: 26 }} />,
    color: '#10B981',
    title: 'Accès direct & sécurisé',
    description: 'Payez un petit montant unique via Mobile Money pour accéder aux coordonnées. Zéro commission, 100% direct.',
  },
  {
    number: '04',
    icon: <CallOutlined style={{ fontSize: 26 }} />,
    color: '#8B5CF6',
    title: 'Contactez directement',
    description: 'Appelez, envoyez un WhatsApp ou un email. Organisez votre visite et finalisez votre projet immobilier.',
  },
];

export default function HowItWorksSection() {
  const { bgAlt, gridLine, text, textSub } = useLandingTheme();
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

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          style={{ textAlign: 'center', marginBottom: 80 }}
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
          <p style={{ fontSize: 18, color: textSub, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            De l&apos;inscription au premier contact en moins de 5 minutes.
          </p>
        </motion.div>

        {/* Steps */}
          <div className="steps-grid" style={{ position: 'relative' }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              style={{ textAlign: 'center' }}
            >
              {/* Step number arc */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${step.color}22, transparent 70%)`,
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
                {step.title}
              </h3>
              <p style={{ fontSize: 15, color: textSub, lineHeight: 1.7, margin: 0 }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
