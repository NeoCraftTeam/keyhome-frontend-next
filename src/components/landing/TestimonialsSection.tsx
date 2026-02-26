'use client';

import { motion } from 'framer-motion';
import { Star } from '@mui/icons-material';
import { useLandingTheme } from './LandingThemeContext';

const testimonials = [
  {
    name: 'Aliou Diarra',
    role: 'Locataire · Abidjan, CI',
    avatar: 'AD',
    color: '#F6475F',
    rating: 5,
    quote: 'J\'ai trouvé mon appartement en 2 jours ! Le système de déblocage est brillant — payer pour les vrais contacts évite les arnaques. Je recommande à 100%.',
  },
  {
    name: 'Marie-Claire Hounkpe',
    role: 'Propriétaire · Yaoundé, CM',
    avatar: 'MH',
    color: '#3B82F6',
    rating: 5,
    quote: 'En tant que propriétaire, je reçois uniquement des contacts sérieux. Mon bien a été loué en moins d\'une semaine. L\'interface est super simple à utiliser.',
  },
  {
    name: 'Kofi Mensah',
    role: 'Acheteur · Lomé, TG',
    avatar: 'KM',
    color: '#10B981',
    rating: 5,
    quote: 'La carte interactive est incroyable pour explorer les quartiers. Les annonces sont vérifiées et les photos correspondent toujours à la réalité.',
  },
  {
    name: 'Fatou Balde',
    role: 'Agent immobilier · Bamako, ML',
    avatar: 'FB',
    color: '#8B5CF6',
    rating: 5,
    quote: 'KeyHome a révolutionné ma façon de travailler. Je gère toutes mes annonces depuis le tableau de bord. Mes clients trouvent exactement ce qu\'ils cherchent.',
  },
];

export default function TestimonialsSection() {
  const { bg, surface, border, text, textSub, quote, textMuted } = useLandingTheme();
  return (
    <section
      id="testimonials"
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
            Témoignages
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
            Ils nous font confiance
          </h2>
          <p style={{ fontSize: 18, color: textSub, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Des milliers d&apos;utilisateurs ont déjà trouvé leur logement idéal avec KeyHome.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                padding: '28px',
                borderRadius: 20,
                background: surface,
                border: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                cursor: 'default',
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} style={{ fontSize: 16, color: '#F59E0B' }} />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: 15,
                  color: quote,
                  lineHeight: 1.7,
                  margin: 0,
                  flex: 1,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${t.color}50, ${t.color}20)`,
                    border: `1px solid ${t.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.color,
                    flexShrink: 0,
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
