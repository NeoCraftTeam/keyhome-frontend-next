'use client';

import { Code } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useLandingTheme } from './LandingThemeContext';

const links = {
  Plateforme: [
    { label: 'Rechercher', href: '/register' },
    { label: 'Publier une annonce', href: '/register' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Tarifs', href: '/register' },
  ],
  Entreprise: [
    { label: 'À propos', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Carrières', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Légal: [
    { label: 'Conditions d\'utilisation', href: '/conditions' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Cookies', href: '#' },
  ],
};

export default function LandingFooter() {
  const { footerBg, footerBorder, text, textMuted, textSub, surface, border } = useLandingTheme();
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
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 48,
            marginBottom: 64,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <Image src="/images/logo.png" alt="KeyHome" width={36} height={36} style={{ borderRadius: 8 }} />
              <span style={{ color: text, fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>
                Key<span style={{ color: '#F6475F' }}>Home</span>
              </span>
            </Link>
            <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.7, maxWidth: 280, margin: '0 0 24px' }}>
              La plateforme immobilière numérique de référence en Afrique. Trouvez, louez ou achetez votre bien en toute confiance.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 12 }}>
              {['f', 'in', 'tw', 'wa'].map((s) => (
                <div
                  key={s}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: surface,
                    border: `1px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: textMuted,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(246,71,95,0.15)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,71,95,0.3)';
                    (e.currentTarget as HTMLElement).style.color = '#F6475F';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = surface;
                    (e.currentTarget as HTMLElement).style.borderColor = border;
                    (e.currentTarget as HTMLElement).style.color = textMuted;
                  }}
                >
                  {s.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>
                {section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = text; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textMuted; }}
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

          {/* NeoCraftTeam credit */}
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
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F6475F'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = textSub; }}
            >
              <Code style={{ fontSize: 14 }} />
              NeoCraftTeam
            </a>
          </div>

          <span style={{ fontSize: 13, color: textMuted }}>
            Fait avec ❤️ pour l'Afrique 🌍
          </span>
        </div>
      </div>
    </footer>
  );
}
