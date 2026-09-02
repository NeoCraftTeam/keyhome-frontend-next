import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { brand } from '@/theme/tokens';
import type { Metadata } from 'next';
import Link from 'next/link';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.keyhome.app/api/v1';

/** Approximate city centers (WGS84) for GEO / Local SEO structured data */
const CITIES: Record<
  string,
  {
    display: string;
    country: string;
    hreflang: string;
    description: string;
    geo?: { lat: number; lng: number };
  }
> = {
  douala: {
    display: 'Douala',
    country: 'Cameroun',
    hreflang: 'fr-CM',
    description:
      'capitale économique du Cameroun, avec ses quartiers prisés comme Bonamoussadi, Akwa et Bonapriso',
    geo: { lat: 4.0511, lng: 9.7679 },
  },
  yaounde: {
    display: 'Yaoundé',
    country: 'Cameroun',
    hreflang: 'fr-CM',
    description:
      'capitale politique du Cameroun, réputée pour ses quartiers résidentiels comme Bastos et Omnisport',
    geo: { lat: 3.848, lng: 11.5021 },
  },
  bafoussam: {
    display: 'Bafoussam',
    country: 'Cameroun',
    hreflang: 'fr-CM',
    description:
      "chef-lieu de la région de l'Ouest, ville dynamique au cœur du pays Bamiléké",
    geo: { lat: 5.4779, lng: 10.4176 },
  },
  abidjan: {
    display: 'Abidjan',
    country: "Côte d'Ivoire",
    hreflang: 'fr-CI',
    description:
      "poumon économique de l'Afrique de l'Ouest, avec Cocody, Marcory et Plateau",
    geo: { lat: 5.36, lng: -4.0083 },
  },
  cotonou: {
    display: 'Cotonou',
    country: 'Bénin',
    hreflang: 'fr-BJ',
    description:
      'capitale économique du Bénin, ville portuaire en pleine expansion',
    geo: { lat: 6.3654, lng: 2.4183 },
  },
  lome: {
    display: 'Lomé',
    country: 'Togo',
    hreflang: 'fr-TG',
    description: "capitale togolaise bordée par l'océan Atlantique",
    geo: { lat: 6.1375, lng: 1.2123 },
  },
  accra: {
    display: 'Accra',
    country: 'Ghana',
    hreflang: 'fr-GH',
    description:
      "capitale ghanéenne, hub technologique et immobilier d'Afrique de l'Ouest",
    geo: { lat: 5.6037, lng: -0.187 },
  },
  dakar: {
    display: 'Dakar',
    country: 'Sénégal',
    hreflang: 'fr-SN',
    description:
      "capitale sénégalaise, entre modernité et tradition, sur la presqu'île du Cap-Vert",
    geo: { lat: 14.7167, lng: -17.4677 },
  },
  bamako: {
    display: 'Bamako',
    country: 'Mali',
    hreflang: 'fr-ML',
    description:
      'capitale malienne en bord du fleuve Niger, marché immobilier en croissance',
    geo: { lat: 12.6392, lng: -8.0029 },
  },
};

/** Country-level landing pages — intercept high-volume "immobilier Cameroun" queries */
const COUNTRIES: Record<
  string,
  {
    display: string;
    hreflang: string;
    cities: string[];
    description: string;
  }
> = {
  cameroun: {
    display: 'Cameroun',
    hreflang: 'fr-CM',
    cities: ['douala', 'yaounde', 'bafoussam'],
    description:
      'capitale économique et politique, marché immobilier en forte croissance avec des villes comme Douala, Yaoundé et Bafoussam',
  },
  'cote-divoire': {
    display: "Côte d'Ivoire",
    hreflang: 'fr-CI',
    cities: ['abidjan'],
    description:
      "hub économique d'Afrique de l'Ouest avec Abidjan, Cocody et le Grand Bassam",
  },
  benin: {
    display: 'Bénin',
    hreflang: 'fr-BJ',
    cities: ['cotonou'],
    description: 'pays côtier dynamique avec Cotonou et Porto-Novo',
  },
  togo: {
    display: 'Togo',
    hreflang: 'fr-TG',
    cities: ['lome'],
    description: 'pays en plein essor avec Lomé, sa capitale portuaire',
  },
  senegal: {
    display: 'Sénégal',
    hreflang: 'fr-SN',
    cities: ['dakar'],
    description:
      "porte de l'Afrique de l'Ouest avec Dakar, Saly et Saint-Louis",
  },
};

export function generateStaticParams() {
  return [
    ...Object.keys(CITIES).map((ville) => ({ ville })),
    ...Object.keys(COUNTRIES).map((pays) => ({ ville: pays })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const key = ville.toLowerCase();
  const city = CITIES[key];
  const country = COUNTRIES[key];
  const site = getSiteOrigin();
  const path = `/immobilier/${key}`;
  const url = absoluteUrl(path);

  if (country) {
    return {
      title: `Immobilier ${country.display} — Location & Vente`,
      description: `Annonces immobilières vérifiées au ${country.display} — appartements, maisons, terrains et villas avec contact direct propriétaire, prix transparents et photos réelles. ${BRAND_TAGLINE}.`,
      alternates: {
        canonical: url,
        languages: {
          'fr-FR': url,
          [country.hreflang]: url,
          'x-default': url,
        },
      },
      openGraph: {
        title: `Immobilier ${country.display} | KeyHome`,
        description: `Annonces vérifiées au ${country.display} — trouvez votre bien idéal. ${BRAND_TAGLINE}.`,
        url,
        siteName: 'KeyHome',
        images: [
          {
            url: `${site}/og?title=${encodeURIComponent(`Immobilier ${country.display}`)}&subtitle=${encodeURIComponent(country.description)}&type=country`,
            width: 1200,
            height: 630,
            alt: `Immobilier ${country.display} — KeyHome`,
          },
        ],
      },
    };
  }

  const name = city?.display || ville;

  return {
    title: `Immobilier à ${name} — Location & Vente`,
    description: `Trouvez votre logement à ${name}${city ? `, ${city.country}` : ''} — appartements, maisons, terrains et villas avec contact direct propriétaire. Annonces vérifiées, prix transparents. ${BRAND_TAGLINE}.`,
    alternates: {
      canonical: url,
      languages: {
        'fr-FR': url,
        ...(city?.hreflang && city.hreflang !== 'fr-FR'
          ? { [city.hreflang]: url }
          : {}),
        'x-default': url,
      },
    },
    openGraph: {
      title: `Immobilier à ${name} | KeyHome`,
      description: `Annonces immobilières vérifiées à ${name} — trouvez votre bien idéal. ${BRAND_TAGLINE}.`,
      url,
      siteName: 'KeyHome',
      images: [
        {
          url: `${site}/og?title=${encodeURIComponent(`Immobilier à ${name}`)}&subtitle=${encodeURIComponent(city?.description ?? 'Annonces vérifiées — KeyHome')}&type=city`,
          width: 1200,
          height: 630,
          alt: `Immobilier à ${name} — KeyHome`,
        },
      ],
    },
    ...(city?.geo && {
      other: {
        'geo.placename': name,
        'geo.position': `${city.geo.lat};${city.geo.lng}`,
        ICBM: `${city.geo.lat}, ${city.geo.lng}`,
      },
    }),
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ ville: string }>;
}) {
  const { ville } = await params;
  const cityKey = ville.toLowerCase();
  const city = CITIES[cityKey];
  const country = COUNTRIES[cityKey];
  const name =
    city?.display ??
    country?.display ??
    ville.charAt(0).toUpperCase() + ville.slice(1);
  const site = getSiteOrigin();

  // ── Country landing page ─────────────────────────────────────────────
  if (country) {
    const countryJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      '@id': absoluteUrl(`/immobilier/${cityKey}#realestate`),
      name: `KeyHome ${country.display}`,
      url: absoluteUrl(`/immobilier/${cityKey}`),
      areaServed: { '@type': 'Country', name: country.display },
      description: `${BRAND_TAGLINE}. Annonces immobilières vérifiées au ${country.display}.`,
    };
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: site },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Immobilier ${country.display}`,
          item: absoluteUrl(`/immobilier/${cityKey}`),
        },
      ],
    };
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(countryJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '48px 20px 80px',
          }}
        >
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
            <span style={{ color: 'var(--kh-text-accent)' }}>
              Immobilier {country.display}
            </span>
          </nav>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 800,
              margin: '0 0 16px',
              lineHeight: 1.15,
            }}
          >
            Immobilier au{' '}
            <span style={{ color: brand.primary }}>{country.display}</span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: 'var(--kh-text-secondary)',
              lineHeight: 1.7,
              maxWidth: 700,
              margin: '0 0 40px',
            }}
          >
            Découvrez les meilleures annonces immobilières au {country.display}{' '}
            — {country.description}. Appartements, maisons, terrains et villas
            vérifiés sur KeyHome.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 56,
            }}
          >
            <Link
              href={`/search?country=${encodeURIComponent(country.display)}`}
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
              🔍 Voir toutes les annonces au {country.display}
            </Link>
          </div>
          <section style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
              Villes disponibles au {country.display}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {country.cities.map((c) => {
                const cityData = CITIES[c];
                return (
                  <Link
                    key={c}
                    href={`/immobilier/${c}`}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 100,
                      border: `1px solid ${brand.primary}`,
                      fontSize: 15,
                      fontWeight: 600,
                      color: brand.primary,
                      textDecoration: 'none',
                      background: 'var(--kh-bg-surface)',
                    }}
                  >
                    {cityData?.display ?? c}
                  </Link>
                );
              })}
            </div>
          </section>
          <section
            style={{
              marginTop: 48,
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
              Pourquoi chercher un logement au {country.display} avec KeyHome ?
            </h2>
            <p>
              KeyHome est la plateforme immobilière de référence pour le marché
              du {country.display}. Chaque annonce est{' '}
              <strong>vérifiée manuellement</strong> : photos authentiques, prix
              cohérents et propriétaires identifiés.
            </p>
            <p>
              Utilisez notre{' '}
              <Link href="/search" style={{ color: brand.primary }}>
                moteur de recherche
              </Link>{' '}
              pour filtrer par ville, budget et type de bien, et contactez les
              propriétaires en direct grâce au paiement Mobile Money sécurisé.
            </p>
          </section>
          <section style={{ marginTop: 56 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--kh-text-primary)',
                marginBottom: 16,
              }}
            >
              Explorer d&apos;autres pays
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(COUNTRIES)
                .filter(([k]) => k !== cityKey)
                .map(([k, co]) => (
                  <Link
                    key={k}
                    href={`/immobilier/${k}`}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 100,
                      border: '1px solid var(--kh-border)',
                      fontSize: 14,
                      color: 'var(--kh-text-accent)',
                      textDecoration: 'none',
                      background: 'var(--kh-bg-surface)',
                    }}
                  >
                    {co.display}
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </>
    );
  }
  // ── /Country landing page ────────────────────────────────────────────

  // Fetch ads for this city from the API
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
      `${API_URL}/ads?city=${encodeURIComponent(name)}&per_page=12&status=available`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const json = await res.json();
      ads = json.data ?? [];
      total = json.meta?.total ?? ads.length;
    }
  } catch {
    // Fail silently — page still renders with SEO text
  }

  // JSON-LD for local business presence
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `KeyHome ${name}`,
    url: absoluteUrl(`/immobilier/${cityKey}`),
    areaServed: {
      '@type': 'City',
      name,
      ...(city && {
        containedInPlace: { '@type': 'Country', name: city.country },
      }),
    },
    description: `${BRAND_TAGLINE}. Trouvez votre logement à ${name} avec KeyHome. ${total} annonces vérifiées disponibles.`,
  };

  if (city?.geo) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: city.geo.lat,
      longitude: city.geo.lng,
    };
  }

  // BreadcrumbList JSON-LD for rich snippets
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: site,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Immobilier à ${name}`,
        item: absoluteUrl(`/immobilier/${cityKey}`),
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
        style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}
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
          <span style={{ color: 'var(--kh-text-accent)' }}>
            Immobilier à {name}
          </span>
        </nav>

        {/* Hero */}
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            margin: '0 0 16px',
            lineHeight: 1.15,
          }}
        >
          Immobilier à <span style={{ color: brand.primary }}>{name}</span>
          {city && (
            <span
              style={{
                fontWeight: 400,
                fontSize: '0.6em',
                color: 'var(--kh-text-muted)',
              }}
            >
              {' '}
              — {city.country}
            </span>
          )}
        </h1>

        <p
          style={{
            fontSize: 18,
            color: 'var(--kh-text-secondary)',
            lineHeight: 1.7,
            maxWidth: 700,
            margin: '0 0 40px',
          }}
        >
          {total > 0
            ? `Découvrez ${total} annonces immobilières vérifiées à ${name}, ${city?.description || 'ville en pleine croissance'}. Appartements, maisons, terrains et villas — contact direct avec les propriétaires.`
            : `Explorez les annonces immobilières à ${name}${city ? `, ${city.description}` : ''}. Nouvelles annonces ajoutées chaque jour.`}
        </p>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 56,
          }}
        >
          <Link
            href={`/search?city=${encodeURIComponent(name.toLowerCase())}`}
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
            🔍 Voir toutes les annonces à {name}
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
            Devenir hôte gratuite
          </Link>
        </div>

        {/* Ad preview grid */}
        {ads.length > 0 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              Dernières annonces à {name}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20,
                marginBottom: 48,
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
                      transition: 'box-shadow 0.2s',
                      background: 'var(--kh-bg-surface)',
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
                          alt={`${ad.title} — annonce immobilière à ${name}`}
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
                      {ad.quarter?.name && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--kh-text-muted)',
                            marginBottom: 6,
                          }}
                        >
                          📍 {ad.quarter.name}
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

        {/* SEO text content */}
        <section
          style={{
            marginTop: 48,
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
            Pourquoi chercher un logement à {name} avec KeyHome ?
          </h2>
          <p>
            KeyHome est la plateforme immobilière de référence pour trouver un
            logement à {name}
            {city ? ` (${city.country})` : ''}. Contrairement aux sites
            classiques, chaque annonce publiée sur KeyHome est{' '}
            <strong>vérifiée manuellement</strong> par notre équipe : photos
            authentiques, prix cohérents et propriétaires identifiés.
          </p>
          <p>
            Que vous cherchiez un <strong>appartement à louer</strong>, une{' '}
            <strong>maison à vendre</strong>, un{' '}
            <strong>terrain à acheter</strong> ou une{' '}
            <strong>villa de standing</strong>, vous trouverez des annonces
            fiables avec contact direct — sans intermédiaire, sans commission
            cachée.
          </p>
          <p>
            Utilisez notre{' '}
            <Link
              href={`/search?city=${encodeURIComponent(name.toLowerCase())}`}
              style={{ color: brand.primary }}
            >
              carte interactive
            </Link>{' '}
            pour explorer les quartiers de {name}, filtrer par budget et
            superficie, et contacter les propriétaires en un clic grâce à un
            micro-paiement sécurisé par Mobile Money.
          </p>
        </section>

        {/* Cross-links to other cities */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--kh-text-primary)',
              marginBottom: 16,
            }}
          >
            Explorez d&apos;autres villes
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(CITIES)
              .filter(([key]) => key !== cityKey)
              .map(([key, c]) => (
                <Link
                  key={key}
                  href={`/immobilier/${key}`}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: '1px solid var(--kh-border)',
                    fontSize: 14,
                    color: 'var(--kh-text-accent)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: 'var(--kh-bg-surface)',
                  }}
                >
                  {c.display}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
