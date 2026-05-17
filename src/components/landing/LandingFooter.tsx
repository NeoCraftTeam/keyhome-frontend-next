'use client';

import Code from '@mui/icons-material/Code';
import Image from 'next/image';
import Link from 'next/link';
import { useLandingTheme } from './LandingThemeContext';
import { brand } from '@/theme/tokens';
import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';

const links = {
  Plateforme: [
    { label: 'Rechercher un logement', href: '/search' },
    { label: 'Publier une annonce', href: '/owner/login' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Témoignages clients', href: '#testimonials' },
  ],
  'Guides & villes': [
    { label: 'Immobilier à Douala', href: '/immobilier/douala' },
    { label: 'Immobilier à Abidjan', href: '/immobilier/abidjan' },
    { label: 'Immobilier à Yaoundé', href: '/immobilier/yaounde' },
    { label: 'Immobilier à Dakar', href: '/immobilier/dakar' },
    { label: 'Appartements (type de bien)', href: '/type-bien/appartement' },
    { label: 'Maisons (type de bien)', href: '/type-bien/maison' },
    { label: 'Comparaisons', href: '/comparaison' },
    { label: 'Annonces à proximité', href: '/nearby' },
  ],
  'Villes populaires': [
    { label: 'Immobilier Douala', href: '/search?city=douala' },
    { label: 'Immobilier Garoua', href: '/search?city=garoua' },
    { label: 'Immobilier Accra', href: '/search?city=accra' },
    { label: 'Immobilier Cotonou', href: '/search?city=cotonou' },
    { label: 'Immobilier Lomé', href: '/search?city=lomé' },
    { label: 'Immobilier Bafoussam', href: '/search?city=bafoussam' },
  ],
  Ressources: [
    { label: 'Inscription gratuite', href: '/register' },
    { label: 'Se connecter', href: '/login' },
    { label: 'Blog', href: '/blog' },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: '/conditions' },
    { label: 'Politique de confidentialité', href: '/confidentialite' },
  ],
};

export default function LandingFooter() {
  const { footerBg, footerBorder, text, textMuted, textSub, surface, border } =
    useLandingTheme();
  return (
    <footer
      className="landing-footer"
      style={{
        background: footerBg,
        borderTop: `1px solid ${footerBorder}`,
        transition: 'background 0.4s ease',
        padding: '72px 24px 40px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gap: 48,
            marginBottom: 64,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                marginBottom: 20,
              }}
            >
              <Image
                src="/images/logo.png"
                alt={BRAND_TITLE_WITH_TAGLINE}
                width={36}
                height={36}
                quality={85}
                loading="lazy"
                style={{ borderRadius: 8 }}
              />
              <span
                style={{
                  color: text,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: '-0.5px',
                }}
              >
                Key<span style={{ color: brand.primary }}>Home</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: 14,
                color: textMuted,
                lineHeight: 1.7,
                maxWidth: 280,
                margin: '0 0 24px',
              }}
            >
              {BRAND_TAGLINE}. La plateforme immobilière numérique de référence
              en Afrique. Trouvez, louez ou achetez votre bien en toute
              confiance.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                {
                  label: 'Facebook',
                  href: 'https://facebook.com/keyhome.africa',
                  icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
                },
                {
                  label: 'WhatsApp',
                  href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '237657507909'}?text=${encodeURIComponent("Bonjour *KeyHome* ! Je suis intéressé(e) par vos services immobiliers. Pouvez-vous m'aider ?")}`,
                  icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`KeyHome sur ${social.label}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: surface,
                    border: `1px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      brand.primaryAlpha15;
                    (e.currentTarget as HTMLElement).style.borderColor =
                      brand.primaryAlpha30;
                    (e.currentTarget as HTMLElement).style.color =
                      brand.primary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = surface;
                    (e.currentTarget as HTMLElement).style.borderColor = border;
                    (e.currentTarget as HTMLElement).style.color = textMuted;
                  }}
                >
                  <svg
                    aria-hidden
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 20,
                }}
              >
                {section}
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      color: textMuted,
                      textDecoration: 'none',
                      fontSize: 14,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = textMuted;
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="footer-bottom"
          style={{
            borderTop: `1px solid ${footerBorder}`,
            paddingTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 13, color: textMuted }}>
            © {new Date().getFullYear()} KeyHome. Tous droits réservés.
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: textMuted,
            }}
          >
            <span>Propulsé par</span>
            <a
              href="https://neocraft.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 700,
                color: textSub,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = brand.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = textSub;
              }}
            >
              <Code style={{ fontSize: 14 }} />
              NeoCraftTeam
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
