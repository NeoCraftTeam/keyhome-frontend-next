import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPARISONS } from './comparisons';
import { brand, gradient } from '@/theme/tokens';

export const metadata: Metadata = {
  title: 'Comparaisons immobilières en Afrique — KeyHome',
  description:
    'Louer vs acheter, Douala vs Yaoundé, appartement vs maison… Comparez les options immobilières en Afrique de l\'Ouest pour faire le meilleur choix.',
  alternates: { canonical: 'https://keyhome.app/comparaison' },
  openGraph: {
    title: 'Comparaisons immobilières — KeyHome',
    description: 'Analyses comparatives pour vous aider à prendre les meilleures décisions immobilières en Afrique.',
    url: 'https://keyhome.app/comparaison',
    siteName: 'KeyHome',
    images: [{ url: 'https://keyhome.app/images/og-cover.png', width: 1200, height: 630, alt: 'Comparaisons immobilières — KeyHome' }],
  },
};

export default function ComparaisonIndexPage() {
  const comparisons = Object.values(COMPARISONS);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
        {' › '}
        <span style={{ color: '#333' }}>Comparaisons</span>
      </nav>

      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, marginBottom: 12 }}>
        Comparaisons <span style={{ color: brand.primary }}>immobilières</span>
      </h1>
      <p style={{ fontSize: 17, color: '#666', lineHeight: 1.7, marginBottom: 48, maxWidth: 640 }}>
        Louer ou acheter ? Douala ou Yaoundé ? Appartement ou maison ? Découvrez nos analyses détaillées pour prendre les meilleures décisions immobilières en Afrique.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {comparisons.map((comp) => (
          <article
            key={comp.slug}
            style={{
              border: '1px solid #eee',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
              <span
                style={{
                  background: gradient.primary135,
                  color: '#fff',
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {comp.labelA}
              </span>
              <span style={{ color: '#888', fontWeight: 700, fontSize: 16 }}>vs</span>
              <span
                style={{
                  background: '#1C1C2E',
                  color: '#fff',
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {comp.labelB}
              </span>
            </div>

            <Link href={`/comparaison/${comp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                {comp.title}
              </h2>
            </Link>

            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
              {comp.metaDescription}
            </p>

            <Link
              href={`/comparaison/${comp.slug}`}
              style={{ color: brand.primary, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
            >
              Voir la comparaison →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
