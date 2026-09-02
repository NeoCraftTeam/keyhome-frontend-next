'use client';

import { motion } from 'framer-motion';
import Star from '@mui/icons-material/Star';
import StarHalf from '@mui/icons-material/StarHalf';
import StarBorder from '@mui/icons-material/StarBorder';
import Verified from '@mui/icons-material/Verified';
import { useLandingTheme } from './LandingThemeContext';
import { brand, semantic } from '@/theme/tokens';

import {
  REVEAL_HEADER,
  REVEAL_ITEM,
  REVEAL_VIEWPORT,
  staggerContainer,
} from './landing-motion';

/**
 * Les avis se révèlent depuis un conteneur unique : chaque carte portait son
 * propre observateur et un `delay: i * 0.1` figé, si bien que la troisième
 * carte attendait encore 0,2 s alors qu'elle était déjà lue.
 */
const CARDS = staggerContainer(0.06);

/** Avatar colour palette — cycles through brand + semantic accents. */
const AVATAR_COLORS = [
  brand.primary,
  semantic.info,
  semantic.successBright,
  semantic.purple,
  semantic.warning,
  semantic.pink,
];

/** Static fallback — shown when the API has no data yet */
const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    display_name: 'Aliou D.',
    initials: 'AD',
    role: 'Client · Abidjan',
    rating: 5,
    comment:
      "J'ai trouvé mon appartement en 2 jours ! Le système de déblocage est brillant — payer pour les vrais contacts évite les arnaques. Je recommande à 100%.",
    created_at: 'Février 2026',
  },
  {
    id: 'fallback-2',
    display_name: 'Marie-Claire H.',
    initials: 'MH',
    role: 'Propriétaire · Yaoundé',
    rating: 4,
    comment:
      "En tant que propriétaire, je reçois uniquement des contacts sérieux. Mon bien a été loué en moins d'une semaine.",
    created_at: 'Janvier 2026',
  },
  {
    id: 'fallback-3',
    display_name: 'Kofi M.',
    initials: 'KM',
    role: 'Client · Lomé',
    rating: 4.5,
    comment:
      'La carte interactive est incroyable pour explorer les quartiers. Les annonces sont vérifiées et les photos correspondent toujours à la réalité.',
    created_at: 'Décembre 2025',
  },
  {
    id: 'fallback-4',
    display_name: 'Fatou B.',
    initials: 'FB',
    role: 'Agent Immobilier · Bamako',
    rating: 5,
    comment:
      'KeyHome a révolutionné ma façon de travailler. Je gère toutes mes annonces depuis le tableau de bord.',
    created_at: 'Novembre 2025',
  },
];

function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Star key={i} style={{ fontSize: 16, color: semantic.warning }} />
      );
    } else if (i - 0.5 === rating) {
      stars.push(
        <StarHalf key={i} style={{ fontSize: 16, color: semantic.warning }} />
      );
    } else {
      stars.push(
        <StarBorder key={i} style={{ fontSize: 16, color: semantic.warning }} />
      );
    }
  }
  return <>{stars}</>;
}

export default function TestimonialsSection() {
  const { bg, surface, border, text, textSub, quote, textMuted } =
    useLandingTheme();
  // Curated platform testimonials — the API /stats/testimonials returns
  // ad/landlord reviews (Review model), NOT app-level testimonials.
  // Use static data until a dedicated PlatformTestimonial model exists.
  const testimonials = FALLBACK_TESTIMONIALS;
  const displayRating = '4.6';
  const displayCount = '120+';

  return (
    <section
      id="testimonials"
      className="landing-section-pad"
      style={{ background: bg, transition: 'background 0.4s ease' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          {...REVEAL_HEADER}
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
          <p
            style={{
              fontSize: 18,
              color: textSub,
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Des milliers d&apos;utilisateurs ont déjà trouvé leur logement idéal
            avec KeyHome.
          </p>
          <div
            role="img"
            aria-label={`Note moyenne ${displayRating} sur 5, basée sur ${displayCount} avis`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
              padding: '8px 18px',
              borderRadius: 100,
              background: `${semantic.warning}1A`,
              border: `1px solid ${semantic.warning}33`,
            }}
          >
            <span aria-hidden style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  style={{ fontSize: 16, color: semantic.warning }}
                />
              ))}
              <StarHalf style={{ fontSize: 16, color: semantic.warning }} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: text }}>
              {displayRating}/5
            </span>
            <span style={{ fontSize: 13, color: textSub }}>
              basé sur {displayCount} avis
            </span>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.ul
          className="testimonials-grid"
          variants={CARDS}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {testimonials.map((t, i) => {
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              /* Aucun état de survol : la carte n'est ni un lien ni un bouton.
                 Le soulèvement qu'elle portait promettait un clic qui n'existe
                 pas — l'utilisateur essayait, rien ne se passait. */
              <motion.li
                key={t.id}
                variants={REVEAL_ITEM}
                style={{
                  padding: '28px',
                  borderRadius: 20,
                  background: surface,
                  border: `1px solid ${border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3 }}>
                  <RatingStars rating={t.rating} />
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
                  &ldquo;{t.comment}&rdquo;
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${avatarColor}50, ${avatarColor}20)`,
                      border: `1px solid ${avatarColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: avatarColor,
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: text,
                        }}
                      >
                        {t.display_name}
                      </span>
                      <Verified
                        titleAccess="Profil vérifié"
                        style={{ fontSize: 14, color: semantic.info }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: textMuted }}>
                      {t.role}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: textMuted,
                        marginTop: 2,
                      }}
                    >
                      {t.created_at}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
