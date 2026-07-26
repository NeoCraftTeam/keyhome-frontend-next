import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteAssetUrl, absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import type { Metadata } from 'next';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/agencies/${id}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const agency = json.data ?? json;
      const name: string = agency.name ?? 'Agence immobilière';
      const total: number = json.meta?.total ?? 0;
      const path = `/agences/${id}`;

      return {
        title: `${name} — Agence immobilière`,
        description: `Annonces de l'agence ${name}${total ? ` — ${total} bien${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}` : ''}. Biens vérifiés, contact direct. ${BRAND_TAGLINE}.`,
        alternates: { canonical: absoluteUrl(path) },
        openGraph: {
          title: `${name} — Agence immobilière | KeyHome`,
          description: `${BRAND_TAGLINE}. Toutes les annonces de l'agence ${name}. Biens vérifiés disponibles sur KeyHome.`,
          url: absoluteUrl(path),
          siteName: 'KeyHome',
          images: [
            {
              url: absoluteAssetUrl(agency.logo as string | undefined),
              width: 1200,
              height: 630,
              alt: name,
            },
          ],
        },
      };
    }
  } catch {
    // Fail silently — fallback metadata below
  }

  const path = `/agences/${id}`;

  return {
    title: 'Profil agence',
    description: `Annonces d'une agence immobilière vérifiée sur KeyHome — biens vérifiés, contact direct. ${BRAND_TAGLINE}.`,
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = getSiteOrigin();
  let jsonLd: Record<string, unknown> | null = null;

  try {
    const res = await fetch(`${API_URL}/agencies/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const agency = json.data ?? json;
      const name: string = agency.name ?? 'Agence';
      const path = `/agences/${id}`;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': absoluteUrl(`${path}#agent`),
        name,
        url: absoluteUrl(path),
        logo: agency.logo ? absoluteAssetUrl(agency.logo as string) : undefined,
        image: agency.logo
          ? absoluteAssetUrl(agency.logo as string)
          : undefined,
        description: `Agence immobilière vérifiée sur KeyHome. ${name} propose des annonces de qualité.`,
        parentOrganization: {
          '@type': 'Organization',
          '@id': `${site}/#organization`,
          name: 'KeyHome',
          url: site,
        },
      };

      if (agency.address) {
        jsonLd.address = {
          '@type': 'PostalAddress',
          streetAddress: agency.address,
          addressCountry: agency.country_code ?? 'CM',
        };
      }

      const rating = agency.rating ?? agency.average_rating;
      const reviewCount = agency.reviews_count ?? agency.ratings_count;
      if (rating != null && (reviewCount ?? 0) > 0) {
        jsonLd.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Number(rating).toFixed(1),
          reviewCount,
          bestRating: '5',
          worstRating: '1',
        };
      }
    }
  } catch {
    // Fail silently — page renders without JSON-LD
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
