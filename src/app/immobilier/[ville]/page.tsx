import type { Metadata } from 'next';
import Link from 'next/link';
import { brand, gradient } from '@/theme/tokens';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Canonical city data used for static generation and display */
const CITIES: Record<string, { display: string; country: string; description: string }> = {
  douala:    { display: 'Douala',    country: 'Cameroun',        description: "capitale économique du Cameroun, avec ses quartiers prisés comme Bonamoussadi, Akwa et Bonapriso" },
  yaounde:   { display: 'Yaoundé',   country: 'Cameroun',        description: "capitale politique du Cameroun, réputée pour ses quartiers résidentiels comme Bastos et Omnisport" },
  bafoussam: { display: 'Bafoussam', country: 'Cameroun',        description: "chef-lieu de la région de l'Ouest, ville dynamique au cœur du pays Bamiléké" },
  abidjan:   { display: 'Abidjan',   country: "Côte d'Ivoire",  description: "poumon économique de l'Afrique de l'Ouest, avec Cocody, Marcory et Plateau" },
  cotonou:   { display: 'Cotonou',   country: 'Bénin',           description: "capitale économique du Bénin, ville portuaire en pleine expansion" },
  lome:      { display: 'Lomé',      country: 'Togo',            description: "capitale togolaise bordée par l'océan Atlantique" },
  accra:     { display: 'Accra',     country: 'Ghana',           description: "capitale ghanéenne, hub technologique et immobilier d'Afrique de l'Ouest" },
  dakar:     { display: 'Dakar',     country: 'Sénégal',         description: "capitale sénégalaise, entre modernité et tradition, sur la presqu'île du Cap-Vert" },
  bamako:    { display: 'Bamako',    country: 'Mali',            description: "capitale malienne en bord du fleuve Niger, marché immobilier en croissance" },
};

export function generateStaticParams() {
  return Object.keys(CITIES).map((ville) => ({ ville }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const city = CITIES[ville.toLowerCase()];
  const name = city?.display || ville;

  return {
    title: `Immobilier à ${name} — Location & Vente`,
    description: `Trouvez votre logement à ${name}${city ? `, ${city.country}` : ''}. Annonces vérifiées : appartements, maisons, terrains et villas. Contact direct propriétaire sur KeyHome.`,
    alternates: {
      canonical: `https://keyhome.app/immobilier/${ville.toLowerCase()}`,
    },
    openGraph: {
      title: `Immobilier à ${name} | KeyHome`,
      description: `Annonces immobilières vérifiées à ${name}. Trouvez votre bien idéal.`,
      url: `https://keyhome.app/immobilier/${ville.toLowerCase()}`,
    },
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
  const name = city?.display || ville.charAt(0).toUpperCase() + ville.slice(1);

  // Fetch ads for this city from the API
  let ads: Array<{
    id: string;
    slug?: string;
    title: string;
    price?: number;
    images?: Array<{ url: string; thumb?: string; large?: string; placeholder?: string | null; is_primary?: boolean }>;
    quarter?: { name?: string; city_name?: string };
  }> = [];
  let total = 0;

  try {
    const res = await fetch(
      `${API_URL}/ads?city=${encodeURIComponent(name)}&per_page=12&status=available`,
      { next: { revalidate: 300 } },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `KeyHome ${name}`,
    url: `https://keyhome.app/immobilier/${cityKey}`,
    areaServed: {
      '@type': 'City',
      name,
      ...(city && { containedInPlace: { '@type': 'Country', name: city.country } }),
    },
    description: `Trouvez votre logement à ${name} avec KeyHome. ${total} annonces vérifiées disponibles.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
          {' › '}
          <span style={{ color: '#333' }}>Immobilier à {name}</span>
        </nav>

        {/* Hero */}
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.15 }}>
          Immobilier à{' '}
          <span style={{ color: brand.primary }}>{name}</span>
          {city && <span style={{ fontWeight: 400, fontSize: '0.6em', color: '#888' }}> — {city.country}</span>}
        </h1>

        <p style={{ fontSize: 18, color: '#666', lineHeight: 1.7, maxWidth: 700, margin: '0 0 40px' }}>
          {total > 0
            ? `Découvrez ${total} annonces immobilières vérifiées à ${name}, ${city?.description || 'ville en pleine croissance'}. Appartements, maisons, terrains et villas — contact direct avec les propriétaires.`
            : `Explorez les annonces immobilières à ${name}${city ? `, ${city.description}` : ''}. Nouvelles annonces ajoutées chaque jour.`
          }
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
          <Link
            href={`/search?city=${encodeURIComponent(name.toLowerCase())}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: gradient.primary135,
              color: '#fff', padding: '14px 28px', borderRadius: 12,
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(246,71,95,0.3)',
            }}
          >
            🔍 Voir toutes les annonces à {name}
          </Link>
          <Link
            href="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: brand.primary,
              padding: '14px 28px', borderRadius: 12, border: `1px solid ${brand.primary}`,
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
              {ads.slice(0, 8).map((ad) => {
                const img = ad.images?.find((i) => i.is_primary) || ad.images?.[0];
                return (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.id}/${ad.slug || ad.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                  >
                    {img && (
                      <div style={{ position: 'relative', paddingTop: '60%', background: '#f5f5f5' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.thumb || img.url}
                          alt={`${ad.title} — annonce immobilière à ${name}`}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{ad.title}</div>
                      {ad.quarter?.name && (
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>📍 {ad.quarter.name}</div>
                      )}
                      {ad.price && (
                        <div style={{ fontWeight: 700, color: brand.primary, fontSize: 15 }}>
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
        <section style={{ marginTop: 48, lineHeight: 1.8, color: '#555', fontSize: 15 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 16 }}>
            Pourquoi chercher un logement à {name} avec KeyHome ?
          </h2>
          <p>
            KeyHome est la plateforme immobilière de référence pour trouver un logement à {name}{city ? ` (${city.country})` : ''}.
            Contrairement aux sites classiques, chaque annonce publiée sur KeyHome est <strong>vérifiée manuellement</strong> par
            notre équipe : photos authentiques, prix cohérents et propriétaires identifiés.
          </p>
          <p>
            Que vous cherchiez un <strong>appartement à louer</strong>, une <strong>maison à vendre</strong>,
            un <strong>terrain à acheter</strong> ou une <strong>villa de standing</strong>, vous trouverez
            des annonces fiables avec contact direct — sans intermédiaire, sans commission cachée.
          </p>
          <p>
            Utilisez notre <Link href={`/search?city=${encodeURIComponent(name.toLowerCase())}`} style={{ color: brand.primary }}>carte interactive</Link> pour
            explorer les quartiers de {name}, filtrer par budget et superficie, et contacter les propriétaires
            en un clic grâce à un micro-paiement sécurisé par Mobile Money.
          </p>
        </section>

        {/* Cross-links to other cities */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 16 }}>
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
                    padding: '8px 18px', borderRadius: 100,
                    border: '1px solid #ddd', fontSize: 14, color: '#444',
                    textDecoration: 'none', transition: 'all 0.2s',
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

