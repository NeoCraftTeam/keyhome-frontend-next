'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import { useLandingTheme } from './LandingThemeContext';
import { brand } from '@/theme/tokens';

import {
  DURATION,
  EASE_OUT as EASE,
  PRESS_WIDE,
  REVEAL_HEADER,
  REVEAL_ITEM,
  REVEAL_VIEWPORT,
  staggerContainer,
} from './landing-motion';

/**
 * L'accordéon révèle ses six lignes depuis un seul conteneur : chaque ligne
 * portait auparavant son propre `whileInView` (six IntersectionObserver) et un
 * `delay: idx * 0.05` figé — une ligne atteinte plus tard attendait encore son
 * tour alors qu'elle était déjà à l'écran.
 */
const LIST = staggerContainer(0.05);

const faqs = [
  {
    question: 'KeyHome est-il gratuit ?',
    answer:
      "L'inscription et la navigation sur KeyHome sont entièrement gratuites. Vous pouvez explorer toutes les annonces, utiliser les filtres et la carte interactive sans rien payer. Seul le déverrouillage des coordonnées d'un annonceur nécessite des crédits.",
  },
  {
    question: 'Comment fonctionne le système de crédits ?',
    answer:
      "Vous achetez un pack de crédits via Mobile Money (MTN, Orange, Moov, Wave…) ou carte bancaire. Chaque déverrouillage d'annonce coûte un nombre fixe de crédits. Une fois déverrouillée, l'annonce reste accessible indéfiniment — vous ne payez qu'une seule fois.",
  },
  {
    question: 'Les annonces sont-elles vérifiées ?',
    answer:
      "Oui. Chaque annonce passe par un processus de modération avant publication. Nous vérifions les photos, la description et l'identité de l'annonceur. Les profils vérifiés sont identifiés par un badge ✓.",
  },
  {
    question: 'Dans quelles villes KeyHome est-il disponible ?',
    answer:
      "KeyHome est une plateforme mondiale ouverte à toutes les villes. Notre catalogue le plus dense couvre aujourd'hui Douala, Yaoundé, Abidjan, Cotonou, Lomé, Accra, Dakar, Bamako et leurs quartiers, et de nouvelles villes s'ajoutent régulièrement dès qu'un propriétaire y publie une annonce.",
  },
  {
    question: 'Comment publier une annonce en tant que propriétaire ?',
    answer:
      'Rendez-vous sur le panneau propriétaire ou agence, créez votre compte gratuitement, puis publiez votre annonce en quelques minutes : photos, description, prix, localisation. Votre annonce sera visible après validation.',
  },
  {
    question: 'Puis-je contacter directement le propriétaire ?',
    answer:
      "Absolument. Une fois l'annonce déverrouillée, vous accédez au numéro de téléphone, WhatsApp et email du propriétaire. Le contact est direct — aucun intermédiaire, aucune commission.",
  },
];

export default function FAQSection() {
  const { text, textSub, textMuted, surface, border, bgAlt } =
    useLandingTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="landing-section-pad"
      style={{ background: bgAlt, transition: 'background 0.4s ease' }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          {...REVEAL_HEADER}
          style={{ textAlign: 'center', marginBottom: 56 }}
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
            Questions fréquentes
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 800,
              color: text,
              letterSpacing: '-1.2px',
              margin: '0 0 16px',
              transition: 'color 0.4s ease',
            }}
          >
            Tout ce que vous devez savoir
          </h2>
          <p
            style={{
              fontSize: 17,
              color: textSub,
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Vous avez des questions ? Vous trouverez probablement la réponse
            ici.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          role="list"
          variants={LIST}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const triggerId = `faq-trigger-${idx}`;
            const panelId = `faq-panel-${idx}`;
            return (
              <motion.div key={idx} role="listitem" variants={REVEAL_ITEM}>
                <div
                  style={{
                    borderRadius: 16,
                    background: surface,
                    border: `1px solid ${isOpen ? brand.primaryAlpha30 : border}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.3s ease',
                  }}
                >
                  <h3 style={{ margin: 0 }}>
                    <motion.button
                      id={triggerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(idx)}
                      whileTap={PRESS_WIDE}
                      transition={{ duration: DURATION.press, ease: EASE }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        minHeight: 60,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: 16,
                        font: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: isOpen ? brand.primary : text,
                          transition: 'color 0.3s ease',
                          lineHeight: 1.4,
                        }}
                      >
                        {faq.question}
                      </span>
                      <span
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isOpen
                            ? brand.primaryAlpha10
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.3s ease',
                        }}
                      >
                        {isOpen ? (
                          <Remove
                            style={{ fontSize: 20, color: brand.primary }}
                          />
                        ) : (
                          <Add style={{ fontSize: 20, color: textMuted }} />
                        )}
                      </span>
                    </motion.button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="panel"
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={{ height: 0, opacity: 0 }}
                        /* Le repli est plus court que l'ouverture : une réponse
                           qu'on referme ne doit pas se faire attendre. */
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: { duration: DURATION.enter, ease: EASE },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: { duration: DURATION.exit, ease: EASE },
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            padding: '0 24px 20px',
                            fontSize: 15,
                            color: textMuted,
                            lineHeight: 1.7,
                          }}
                        >
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
