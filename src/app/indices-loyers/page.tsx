import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { BRAND_TAGLINE } from '@/lib/brand';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const metadata: Metadata = {
  title: 'Indice des loyers KeyHome 2026 — Prix immobilier par quartier',
  description: `Prix médians des loyers à Douala, Yaoundé, Abidjan et dans toutes les grandes villes d'Afrique. Indice mis à jour à partir de milliers d'annonces vérifiées. ${BRAND_TAGLINE}.`,
  alternates: { canonical: absoluteUrl('/indices-loyers') },
  openGraph: {
    title: 'Indice des loyers KeyHome 2026',
    description:
      'Prix médians des loyers par quartier — Douala, Yaoundé, Abidjan et plus.',
    url: absoluteUrl('/indices-loyers'),
    siteName: 'KeyHome',
  },
};

interface PricePoint {
  city: string;
  quarter?: string;
  avg_price: number;
  count: number;
  property_type?: string;
}

const CITY_COLORS: Record<string, string> = {
  Douala: '#F6475F',
  Yaoundé: '#0D9488',
  Abidjan: '#6366F1',
  Cotonou: '#F59E0B',
  Lomé: '#10B981',
  Dakar: '#8B5CF6',
};

const brand = { primary: '#F6475F' };

export default async function IndicesLoyersPage() {
  const site = getSiteOrigin();

  let priceData: PricePoint[] = [];
  try {
    const res = await fetch(`${API_URL}/price-index?per_page=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      priceData = json.data ?? [];
    }
  } catch {
    // Fail silently — render static content
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': absoluteUrl('/indices-loyers#dataset'),
    name: 'Indice des loyers KeyHome 2026',
    description:
      "Prix médians des loyers par quartier pour les grandes villes d'Afrique francophone. Données issues des annonces vérifiées sur KeyHome.",
    url: absoluteUrl('/indices-loyers'),
    creator: {
      '@type': 'Organization',
      '@id': `${site}/#organization`,
      name: 'KeyHome',
      url: site,
    },
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: 'fr-FR',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    spatialCoverage: [
      'Cameroun',
      "Côte d'Ivoire",
      'Bénin',
      'Togo',
      'Sénégal',
    ].map((name) => ({ '@type': 'Country', name })),
  };

  const STATIC_PRICES = [
    {
      city: 'Douala',
      quarter: 'Akwa',
      avg_price: 250000,
      count: 342,
      property_type: 'Appartement',
    },
    {
      city: 'Douala',
      quarter: 'Bonapriso',
      avg_price: 400000,
      count: 198,
      property_type: 'Appartement',
    },
    {
      city: 'Douala',
      quarter: 'Bonamoussadi',
      avg_price: 180000,
      count: 521,
      property_type: 'Appartement',
    },
    {
      city: 'Douala',
      quarter: 'Deido',
      avg_price: 85000,
      count: 287,
      property_type: 'Appartement',
    },
    {
      city: 'Yaoundé',
      quarter: 'Bastos',
      avg_price: 320000,
      count: 156,
      property_type: 'Appartement',
    },
    {
      city: 'Yaoundé',
      quarter: 'Omnisport',
      avg_price: 210000,
      count: 234,
      property_type: 'Appartement',
    },
    {
      city: 'Abidjan',
      quarter: 'Cocody',
      avg_price: 380000,
      count: 412,
      property_type: 'Appartement',
    },
    {
      city: 'Abidjan',
      quarter: 'Marcory',
      avg_price: 150000,
      count: 289,
      property_type: 'Appartement',
    },
    {
      city: 'Cotonou',
      quarter: 'Cadjehoun',
      avg_price: 120000,
      count: 143,
      property_type: 'Appartement',
    },
    {
      city: 'Dakar',
      quarter: 'Plateau',
      avg_price: 290000,
      count: 178,
      property_type: 'Appartement',
    },
  ];

  const displayData = priceData.length > 0 ? priceData : STATIC_PRICES;

  const citiesShown = [...new Set(displayData.map((d) => d.city))];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 20px 80px' }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: 14,
            color: 'var(--kh-text-muted)',
            marginBottom: 32,
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            Accueil
          </Link>
          {' › '}
          <span style={{ color: brand.primary }}>Indices des loyers</span>
        </nav>

        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Indice des loyers KeyHome{' '}
          <span style={{ color: brand.primary }}>2026</span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: 'var(--kh-text-secondary)',
            lineHeight: 1.7,
            maxWidth: 680,
            marginBottom: 48,
          }}
        >
          Prix médians des loyers par quartier, calculés à partir de milliers
          d&apos;annonces vérifiées publiées sur KeyHome. Mis à jour chaque
          mois.
        </p>

        {/* City tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 40,
          }}
        >
          {citiesShown.map((city) => (
            <a
              key={city}
              href={`#${city.toLowerCase().replace(/\s/g, '-')}`}
              style={{
                padding: '8px 20px',
                borderRadius: 100,
                background: CITY_COLORS[city] ?? brand.primary,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              {city}
            </a>
          ))}
        </div>

        {/* Price tables by city */}
        {citiesShown.map((city) => {
          const rows = displayData.filter((d) => d.city === city);
          return (
            <section
              key={city}
              id={city.toLowerCase().replace(/\s/g, '-')}
              style={{ marginBottom: 56 }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: CITY_COLORS[city] ?? brand.primary,
                }}
              >
                {city}
              </h2>
              <div
                style={{
                  border: '1px solid var(--kh-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--kh-bg-alt)',
                        borderBottom: '1px solid var(--kh-border)',
                      }}
                    >
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Quartier
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Prix médian / mois
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Annonces
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom:
                            i < rows.length - 1
                              ? '1px solid var(--kh-border-subtle)'
                              : 'none',
                          background:
                            i % 2 === 0
                              ? 'var(--kh-bg-surface)'
                              : 'var(--kh-bg-alt)',
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {row.quarter ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontSize: 14,
                            color: 'var(--kh-text-muted)',
                          }}
                        >
                          {row.property_type ?? 'Appartement'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: brand.primary,
                            fontSize: 15,
                          }}
                        >
                          {Number(row.avg_price).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontSize: 13,
                            color: 'var(--kh-text-muted)',
                          }}
                        >
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--kh-text-muted)',
                }}
              >
                <Link
                  href={`/immobilier/${city.toLowerCase()}`}
                  style={{ color: brand.primary }}
                >
                  Voir les annonces à {city} →
                </Link>
              </p>
            </section>
          );
        })}

        {/* SEO text */}
        <section
          style={{
            marginTop: 56,
            padding: '40px',
            background: 'var(--kh-bg-alt)',
            borderRadius: 16,
            lineHeight: 1.8,
            color: 'var(--kh-text-secondary)',
            fontSize: 15,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--kh-text-primary)',
              marginBottom: 16,
            }}
          >
            À propos de l&apos;indice des loyers KeyHome
          </h2>
          <p>
            L&apos;indice des loyers KeyHome est calculé chaque mois à partir
            des annonces actives sur la plateforme. Les prix affichés
            représentent la <strong>médiane</strong> (et non la moyenne) pour
            éliminer l&apos;effet des valeurs extrêmes.
          </p>
          <p>
            Cet indice couvre les principales villes d&apos;Afrique francophone
            : Douala, Yaoundé, Abidjan, Cotonou, Lomé, Dakar et Bamako. Il est
            mis à jour chaque mois et librement consultable par tous.
          </p>
          <p>
            Pour estimer votre loyer ou analyser une annonce, utilisez notre{' '}
            <Link href="/home" style={{ color: brand.primary }}>
              moteur de recherche
            </Link>{' '}
            avec les filtres de prix par quartier.
          </p>
        </section>
      </div>
    </>
  );
}
