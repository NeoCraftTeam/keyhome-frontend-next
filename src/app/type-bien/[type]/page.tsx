import type { SvgIconComponent } from '@mui/icons-material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BedIcon from '@mui/icons-material/Bed';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import OtherHousesIcon from '@mui/icons-material/OtherHouses';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brand } from '@/theme/tokens';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PropertyTypeData {
  display: string;
  plural: string;
  apiParam: string;
  Icon: SvgIconComponent;
  description: string;
  longDescription: string;
  features: string[];
}

const PROPERTY_TYPES: Record<string, PropertyTypeData> = {
  appartement: {
    display: 'Appartement',
    plural: 'Appartements',
    apiParam: 'Appartement',
    Icon: ApartmentIcon,
    description: 'Appartements à louer et à vendre, partout dans le monde',
    longDescription:
      "Trouvez l'appartement idéal parmi nos annonces vérifiées. Du studio compact aux grands appartements familiaux, KeyHome référence toutes les typologies — dans les grandes métropoles comme dans les villes secondaires.",
    features: [
      'Studio',
      'F1 / F2 / F3',
      'Appartement meublé',
      'Résidence sécurisée',
      'Gardiennage 24h/24',
    ],
  },
  maison: {
    display: 'Maison',
    plural: 'Maisons',
    apiParam: 'Maison',
    Icon: HomeIcon,
    description: 'Maisons à louer et à vendre, partout dans le monde',
    longDescription:
      "Découvrez des maisons individuelles, jumelées ou en bande. Chaque annonce est vérifiée par notre équipe pour garantir l'authenticité des photos et des prix.",
    features: [
      'Maison individuelle',
      'Villa',
      'Duplex',
      'Clôturée / Sécurisée',
      'Avec jardin',
    ],
  },
  villa: {
    display: 'Villa',
    plural: 'Villas',
    apiParam: 'Villa',
    Icon: OtherHousesIcon,
    description: 'Villas de standing à louer et à vendre',
    longDescription:
      "Villas de prestige, propriétés avec piscine, résidences d'exception — KeyHome référence les bien les plus haut de gamme du marché immobilier africain. Idéal pour les expatriés, diplomates et cadres supérieurs.",
    features: [
      'Piscine',
      'Jardin paysagé',
      'Gardiennage',
      'Parking privé',
      'Cuisine équipée',
    ],
  },
  terrain: {
    display: 'Terrain',
    plural: 'Terrains',
    apiParam: 'Terrain',
    Icon: LandscapeIcon,
    description: 'Terrains à vendre et à bâtir, partout dans le monde',
    longDescription:
      'Investissez dans un terrain viabilisé ou un lotissement. KeyHome liste les terrains disponibles avec titre foncier, pour construire votre projet immobilier en toute sécurité.',
    features: [
      'Titre foncier',
      'Terrain viabilisé',
      'Lotissement',
      'Zone résidentielle',
      'Zone commerciale',
    ],
  },
  bureau: {
    display: 'Bureau',
    plural: 'Bureaux',
    apiParam: 'Bureau',
    Icon: BusinessIcon,
    description: 'Bureaux et espaces commerciaux à louer et à vendre',
    longDescription:
      'Locaux professionnels, open spaces, salles de réunion et plateaux de bureaux — KeyHome accompagne les entreprises dans leur recherche de locaux adaptés.',
    features: [
      'Open space',
      'Salle de réunion',
      'Accès fibre',
      'Parking',
      'Climatisation',
    ],
  },
  studio: {
    display: 'Studio',
    plural: 'Studios',
    apiParam: 'Studio',
    Icon: BedIcon,
    description: 'Studios meublés et non meublés à louer',
    longDescription:
      'Étudiants, jeunes actifs, expatriés — trouvez un studio fonctionnel et abordable. Meublés ou vides, nos studios sont vérifiés et disponibles rapidement.',
    features: [
      'Studio meublé',
      'Kichenette',
      'Connexion internet',
      'Eau chaude',
      'Charges incluses',
    ],
  },
};

const CITIES = [
  { key: 'douala', display: 'Douala' },
  { key: 'yaounde', display: 'Yaoundé' },
  { key: 'abidjan', display: 'Abidjan' },
  { key: 'cotonou', display: 'Cotonou' },
  { key: 'dakar', display: 'Dakar' },
  { key: 'lome', display: 'Lomé' },
  { key: 'accra', display: 'Accra' },
];

export function generateStaticParams() {
  return Object.keys(PROPERTY_TYPES).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const data = PROPERTY_TYPES[type.toLowerCase()];
  if (!data) notFound();

  const site = getSiteOrigin();
  const path = `/type-bien/${type.toLowerCase()}`;

  return {
    title: `${data.plural} à louer et à vendre`,
    description: `${data.description} — annonces vérifiées, contact direct propriétaire, prix transparents, photos et carte. ${BRAND_TAGLINE}.`,
    alternates: {
      canonical: absoluteUrl(path),
      languages: buildHreflangAlternates(absoluteUrl(path)),
    },
    openGraph: {
      title: `${data.plural} | KeyHome`,
      description: `${data.description}. Annonces vérifiées. ${BRAND_TAGLINE}.`,
      url: absoluteUrl(path),
      siteName: 'KeyHome',
      images: [
        {
          url: `${site}/og?title=${encodeURIComponent(data.plural)}&subtitle=${encodeURIComponent(data.description)}`,
          width: 1200,
          height: 630,
          alt: `${data.plural} — KeyHome`,
        },
      ],
    },
  };
}

export default async function PropertyTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const typeKey = type.toLowerCase();
  const data = PROPERTY_TYPES[typeKey];

  if (!data) notFound();

  // Fetch ads for this property type
  let ads: Array<{
    id: string;
    slug?: string;
    title: string;
    price?: number;
    images?: Array<{
      url: string;
      thumb?: string;
      large?: string;
      placeholder?: string | null;
      is_primary?: boolean;
    }>;
    quarter?: { name?: string; city_name?: string };
  }> = [];
  let total = 0;

  try {
    const res = await fetch(
      `${API_URL}/ads?type=${encodeURIComponent(data.apiParam)}&per_page=12&status=available`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const json = await res.json();
      ads = json.data ?? [];
      total = json.meta?.total ?? ads.length;
    }
  } catch {
    // Fail silently
  }

  // JSON-LD ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${data.plural} — KeyHome`,
    description: `${BRAND_TAGLINE}. ${data.description}`,
    url: absoluteUrl(`/type-bien/${typeKey}`),
    numberOfItems: total,
    itemListElement: ads.slice(0, 10).map((ad, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/ads/${ad.slug || ad.id}`),
      name: ad.title,
    })),
  };

  // BreadcrumbList JSON-LD for rich snippets
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: getSiteOrigin(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Types de biens',
        item: absoluteUrl('/type-bien'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.plural,
        item: absoluteUrl(`/type-bien/${typeKey}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 20px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: 13,
            color: 'var(--kh-text-muted)',
            marginBottom: 24,
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            KeyHome
          </Link>
          {' › '}
          <span>Types de biens</span>
          {' › '}
          <span style={{ color: 'var(--kh-text-primary)', fontWeight: 600 }}>
            {data.plural}
          </span>
        </nav>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 16,
              color: 'var(--kh-text-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <data.Icon style={{ fontSize: 36, color: brand.primary }} />
            {data.plural} à louer et à vendre
          </h1>
          {total > 0 && (
            <p
              style={{
                color: brand.primary,
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 12,
              }}
            >
              {total.toLocaleString('fr-FR')} annonce{total > 1 ? 's' : ''}{' '}
              disponible{total > 1 ? 's' : ''}
            </p>
          )}
          <p
            style={{
              color: 'var(--kh-text-secondary)',
              lineHeight: 1.8,
              fontSize: 16,
              maxWidth: 720,
            }}
          >
            {data.longDescription}
          </p>
        </div>

        {/* Feature tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 40,
          }}
        >
          {data.features.map((f) => (
            <span
              key={f}
              style={{
                background: 'var(--kh-bg-tinted)',
                color: brand.primaryDark,
                padding: '6px 14px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 48,
          }}
        >
          <Link
            href={`/search?type=${encodeURIComponent(data.apiParam)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: brand.primary,
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(246,71,95,0.3)',
            }}
          >
            <SearchIcon style={{ fontSize: 18 }} />
            Voir tous les {data.plural.toLowerCase()}
          </Link>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: brand.primary,
              padding: '14px 28px',
              borderRadius: 12,
              border: `1px solid ${brand.primary}`,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Devenir hôte
          </Link>
        </div>

        {/* Ad preview grid */}
        {ads.length > 0 && (
          <>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
                color: 'var(--kh-text-strong)',
              }}
            >
              Dernières annonces — {data.plural}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20,
                marginBottom: 56,
              }}
            >
              {ads.slice(0, 8).map((ad) => {
                const img =
                  ad.images?.find((i) => i.is_primary) || ad.images?.[0];
                return (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.slug || ad.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid var(--kh-border-subtle)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      display: 'block',
                    }}
                  >
                    {img && (
                      <div
                        style={{
                          position: 'relative',
                          paddingTop: '60%',
                          background: 'var(--kh-bg-alt)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.thumb || img.url}
                          alt={`${ad.title} — ${data.display} à ${ad.quarter?.city_name || 'vendre ou louer'}`}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          marginBottom: 4,
                          lineHeight: 1.3,
                        }}
                      >
                        {ad.title}
                      </div>
                      {ad.quarter?.city_name && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--kh-text-muted)',
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <PlaceIcon style={{ fontSize: 14 }} />
                          {ad.quarter.city_name}
                        </div>
                      )}
                      {ad.price && (
                        <div
                          style={{
                            fontWeight: 700,
                            color: brand.primary,
                            fontSize: 15,
                          }}
                        >
                          {Number(ad.price).toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* By city cross-links */}
        <section style={{ marginTop: 40, marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 20,
              color: 'var(--kh-text-strong)',
            }}
          >
            {data.plural} par ville
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {CITIES.map((city) => (
              <Link
                key={city.key}
                href={`/search?city=${city.key}&type=${encodeURIComponent(data.apiParam)}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--kh-border)',
                  fontSize: 14,
                  color: 'var(--kh-text-accent)',
                  textDecoration: 'none',
                  background: 'var(--kh-bg-surface)',
                }}
              >
                {data.display} à {city.display}
              </Link>
            ))}
          </div>
        </section>

        {/* SEO text */}
        <section
          style={{
            lineHeight: 1.8,
            color: 'var(--kh-text-secondary)',
            fontSize: 15,
            maxWidth: 800,
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
            Pourquoi trouver votre {data.display.toLowerCase()} sur KeyHome ?
          </h2>
          <p>
            KeyHome est la plateforme immobilière africaine qui vérifie chaque
            annonce avant publication.{' '}
            <strong>Pas de fausses photos, pas de prix gonflés</strong> — notre
            équipe contrôle l&apos;authenticité de chaque{' '}
            {data.display.toLowerCase()} mis en ligne.
          </p>
          <p>
            Grâce à notre système de paiement sécurisé par{' '}
            <strong>Mobile Money (Orange Money, MTN Momo, Wave)</strong>,
            contactez le propriétaire directement sans intermédiaire et sans
            commission cachée.
          </p>
          <p>
            Notre moteur de recherche avancé vous permet de filtrer les{' '}
            <strong>{data.plural.toLowerCase()}</strong> par ville, quartier,
            prix, surface et nombre de pièces, avec une{' '}
            <Link
              href={`/search?type=${encodeURIComponent(data.apiParam)}`}
              style={{ color: brand.primary }}
            >
              carte interactive
            </Link>{' '}
            pour visualiser toutes les annonces en temps réel.
          </p>
        </section>

        {/* Other property types */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--kh-text-primary)',
              marginBottom: 16,
            }}
          >
            Autres types de biens
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(PROPERTY_TYPES)
              .filter(([key]) => key !== typeKey)
              .map(([key, pt]) => (
                <Link
                  key={key}
                  href={`/type-bien/${key}`}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: '1px solid var(--kh-border)',
                    fontSize: 14,
                    color: 'var(--kh-text-accent)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--kh-bg-surface)',
                  }}
                >
                  <pt.Icon style={{ fontSize: 16 }} />
                  {pt.plural}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
