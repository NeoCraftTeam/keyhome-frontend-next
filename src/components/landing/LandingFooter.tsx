'use client';

import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';
import { brand } from '@/theme/tokens';
import type { SvgIconComponent } from '@mui/icons-material';
import Code from '@mui/icons-material/Code';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import HistoryEduOutlined from '@mui/icons-material/HistoryEduOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  REVEAL_ITEM,
  REVEAL_VIEWPORT,
  staggerContainer,
} from './landing-motion';
import { useLandingTheme } from './LandingThemeContext';

const SUPPORT_EMAIL = 'contact@keyhome.app';
const WHATSAPP_HREF = `https://wa.me/${
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '237657507909'
}?text=${encodeURIComponent(
  "Bonjour *KeyHome* ! Je suis intéressé(e) par vos services immobiliers. Pouvez-vous m'aider ?"
)}`;

/**
 * Colonnes de liens. Chaque `href` doit correspondre à une route qui existe :
 * les ancres (`#pricing`, `#faq`…) ciblent les sections de cette même page,
 * et un lien vers un espace privé (publier une annonce) passe volontairement
 * par la page de connexion bailleur.
 */
const COLUMNS: ReadonlyArray<{
  title: string;
  items: ReadonlyArray<{ label: string; href: string }>;
}> = [
  {
    title: 'Plateforme',
    items: [
      { label: 'Rechercher un logement', href: '/search' },
      { label: 'Annonces à proximité', href: '/nearby' },
      { label: 'Comparer des biens', href: '/comparaison' },
      { label: 'Prix du marché', href: '/prix-marche' },
      { label: 'Indices de loyers', href: '/indices-loyers' },
    ],
  },
  {
    title: 'Propriétaires',
    items: [
      { label: 'Publier une annonce', href: '/owner/login' },
      { label: 'Créer un compte bailleur', href: '/owner/register' },
      { label: 'Tarifs & crédits', href: '#pricing' },
      { label: 'Pourquoi KeyHome', href: '#landlords' },
    ],
  },
  {
    title: 'Ressources',
    items: [
      { label: 'Comment ça marche', href: '#how-it-works' },
      { label: 'Questions fréquentes', href: '#faq' },
      { label: 'Témoignages clients', href: '#testimonials' },
      { label: 'Blog', href: '/blog' },
      { label: "Centre d'aide", href: '/aide' },
    ],
  },
  {
    title: 'Compte & légal',
    items: [
      { label: 'Se connecter', href: '/login' },
      { label: 'Inscription gratuite', href: '/register' },
      { label: 'Nous contacter', href: '/contact' },
      { label: "Conditions d'utilisation", href: '/conditions' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
    ],
  },
];

/**
 * Garanties produit — chacune correspond à une capacité réellement livrée
 * (modération `pending`/`declined`, paiements, réservation de créneaux,
 * signature électronique du bail). Ne rien y ajouter qui ne soit pas tenu.
 */
const ASSURANCES: ReadonlyArray<{
  Icon: SvgIconComponent;
  title: string;
  text: string;
}> = [
  {
    Icon: VerifiedUserOutlined,
    title: 'Annonces vérifiées',
    text: 'Chaque annonce est validée avant sa mise en ligne.',
  },
  {
    Icon: LockOutlined,
    title: 'Paiements sécurisés',
    text: 'Transactions chiffrées et reçus téléchargeables.',
  },
  {
    Icon: EventAvailableOutlined,
    title: 'Visites planifiées',
    text: 'Créneaux réservés en ligne, confirmés en direct.',
  },
  {
    Icon: HistoryEduOutlined,
    title: 'Baux signés en ligne',
    text: 'Signature électronique et archivage du contrat.',
  },
];

/**
 * Réseaux sociaux. Les glyphes sont des tracés en dur plutôt que des icônes
 * MUI : le paquet n'expose ni TikTok ni le logo X actuel, et un jeu d'icônes
 * mi-MUI mi-SVG donnerait quatre épaisseurs de trait différentes sur la même
 * rangée. `viewBox="0 0 24 24"` et `fill="currentColor"` pour les quatre.
 */
const SOCIALS: ReadonlyArray<{ label: string; href: string; path: string }> = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/keyhomeApp',
    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/keyhome.app',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    /* « X (ex-Twitter) » : le seul logo que personne ne reconnaît sans
       légende — le nom complet part dans l'`aria-label`. */
    label: 'X (ex-Twitter)',
    href: 'https://x.com/Keyhomeapp',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@keyhome.app',
    path: 'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.84-2.48V9.75a5.68 5.68 0 1 0 4.93 5.62V8.9a7.35 7.35 0 0 0 4.3 1.38V7.2a4.29 4.29 0 0 1-3.24-1.38z',
  },
];

/**
 * Révélation en cascade. Le pied de page n'est atteint qu'une fois par visite,
 * il peut donc s'animer ; `once: true` garantit qu'il ne rejoue jamais.
 */
const CONTAINER = staggerContainer();

export default function LandingFooter() {
  const {
    footerBg,
    footerBorder,
    text,
    textMuted,
    textSub,
    surface,
    bgAlt,
    border,
  } = useLandingTheme();

  /**
   * Les états `:hover` / `:active` / `:focus-visible` vivent dans globals.css
   * (hover neutralisé sur écran tactile, retour de pression au doigt) ; les
   * couleurs du thème landing leur sont transmises par variables CSS.
   */
  const rootStyle = {
    '--kh-footer-fg': text,
    '--kh-footer-sub': textSub,
    '--kh-footer-muted': textMuted,
    '--kh-footer-surface': surface,
    '--kh-footer-tile': bgAlt,
    '--kh-footer-border': border,
    '--kh-footer-hairline': footerBorder,
    '--kh-footer-brand': brand.primary,
    '--kh-footer-brand-soft': brand.primaryAlpha15,
    '--kh-footer-brand-line': brand.primaryAlpha30,
    '--kh-footer-brand-glow': brand.primaryAlpha40,
    background: footerBg,
    borderTop: `1px solid ${footerBorder}`,
  } as CSSProperties;

  return (
    <footer className="landing-footer" style={rootStyle}>
      <div className="landing-footer-inner">
        <motion.div
          className="footer-grid"
          variants={CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
        >
          {/* Marque, promesse, contacts directs */}
          <motion.div variants={REVEAL_ITEM}>
            <Link
              href="/"
              className="footer-brand"
              aria-label="KeyHome — retour à l'accueil"
            >
              <Image
                src="/images/logo.png"
                alt={BRAND_TITLE_WITH_TAGLINE}
                width={36}
                height={36}
                loading="lazy"
                style={{ borderRadius: 8 }}
              />
              <span className="footer-wordmark">
                Key<span style={{ color: brand.primary }}>Home</span>
              </span>
            </Link>

            <p className="footer-tagline">
              {BRAND_TAGLINE}. La plateforme qui réunit propriétaires,
              locataires et agents — de la recherche du bien jusqu&apos;à la
              signature du bail, dans un seul espace.
            </p>

            <div className="footer-contacts">
              <a className="footer-contact" href={`mailto:${SUPPORT_EMAIL}`}>
                <MailOutlineRounded aria-hidden style={{ fontSize: 17 }} />
                {SUPPORT_EMAIL}
              </a>
              <a
                className="footer-contact"
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsApp aria-hidden style={{ fontSize: 17 }} />
                Écrire sur WhatsApp
              </a>
            </div>

            <div className="footer-social-row">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  className="footer-social"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`KeyHome sur ${social.label}`}
                >
                  <svg
                    aria-hidden
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </motion.div>

          {COLUMNS.map((column) => (
            <motion.div key={column.title} variants={REVEAL_ITEM}>
              <h2 className="footer-col-title">{column.title}</h2>
              <div className="footer-links">
                {column.items.map((item) =>
                  /* Les ancres restent de simples `<a>` : pas de navigation
                     client à déclencher pour un défilement interne. */
                  item.href.startsWith('#') ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className="footer-link"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="footer-link"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Garanties : le seul bloc « décoratif » du pied de page, chaque
            tuile renvoyant à une capacité réellement livrée. */}
        <motion.div
          className="footer-assurances"
          variants={CONTAINER}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
        >
          {ASSURANCES.map(({ Icon, title, text }) => (
            <motion.div
              key={title}
              className="footer-assurance"
              variants={REVEAL_ITEM}
            >
              <span className="footer-assurance-icon">
                <Icon aria-hidden style={{ fontSize: 19 }} />
              </span>
              <div>
                <p className="footer-assurance-title">{title}</p>
                <p className="footer-assurance-text">{text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} KeyHome. Tous droits réservés.
          </p>

          <div className="footer-bottom-legal">
            <Link href="/conditions" className="footer-legal-link">
              Conditions
            </Link>
            <span className="footer-legal-dot" aria-hidden />
            <Link href="/confidentialite" className="footer-legal-link">
              Confidentialité
            </Link>
            <span className="footer-legal-dot" aria-hidden />
            {/* La politique cookies est une section de la page confidentialité,
                pas une route à part (`/confidentialite#cookies`). */}
            <Link href="/confidentialite#cookies" className="footer-legal-link">
              Cookies
            </Link>
          </div>

          <a
            className="footer-credit"
            href="https://www.neocraft.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Code aria-hidden style={{ fontSize: 15 }} />
            Propulsé par <strong>NeoCraftTeam</strong>
          </a>
        </div>
      </div>
    </footer>
  );
}
