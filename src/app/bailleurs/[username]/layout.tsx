import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteAssetUrl, absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import type { Metadata } from 'next';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const res = await fetch(`${API_URL}/users/${username}/public-profile`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const user = json.data ?? json;
      const displayName: string =
        user.display_name ??
        (`${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
          'Propriétaire');
      const total: number = user.total_active_ads ?? 0;
      const city: string = user.city_name ? ` à ${user.city_name}` : '';
      const avatarUrl: string = user.avatar
        ? absoluteAssetUrl(user.avatar as string)
        : absoluteAssetUrl('/images/logo.png');

      const path = `/bailleurs/${username}`;

      return {
        title: `${displayName} — Propriétaire immobilier | KeyHome`,
        description: `${BRAND_TAGLINE}. Découvrez les ${total ? `${total} annonce${total > 1 ? 's' : ''} de ` : 'annonces de '}${displayName}${city} sur KeyHome. Biens vérifiés, contact direct.`,
        alternates: { canonical: absoluteUrl(path) },
        openGraph: {
          title: `${displayName} — Propriétaire | KeyHome`,
          description: `${BRAND_TAGLINE}. Profil propriétaire de ${displayName} sur KeyHome.${total ? ` ${total} bien${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}.` : ''}`,
          url: absoluteUrl(path),
          siteName: 'KeyHome',
          images: [
            { url: avatarUrl, width: 400, height: 400, alt: displayName },
          ],
        },
      };
    }
  } catch {
    // Fail silently — fallback metadata below
  }

  const path = `/bailleurs/${username}`;

  return {
    title: 'Profil propriétaire — KeyHome',
    description: `${BRAND_TAGLINE}. Découvrez les annonces de ce propriétaire sur KeyHome. Biens immobiliers vérifiés, contact direct.`,
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default async function BailleurLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const site = getSiteOrigin();
  let jsonLd: Record<string, unknown> | null = null;

  try {
    const res = await fetch(`${API_URL}/users/${username}/public-profile`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const user = json.data ?? json;
      const displayName: string =
        user.display_name ??
        (`${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
          'Propriétaire');
      const path = `/bailleurs/${username}`;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': absoluteUrl(`${path}#person`),
        name: displayName,
        url: absoluteUrl(path),
        jobTitle: 'Propriétaire immobilier',
        description: `Propriétaire immobilier vérifié sur KeyHome.${user.bio ? ' ' + String(user.bio).slice(0, 200) : ''}`,
        memberOf: {
          '@type': 'Organization',
          '@id': `${site}/#organization`,
          name: 'KeyHome',
          url: site,
        },
      };

      if (user.avatar) {
        jsonLd.image = {
          '@type': 'ImageObject',
          url: absoluteAssetUrl(user.avatar as string),
          width: 400,
          height: 400,
        };
      }

      if (user.city_name) {
        jsonLd.address = {
          '@type': 'PostalAddress',
          addressLocality: user.city_name,
        };
      }

      const avgRating = user.review_stats?.avg_rating;
      const totalReviews = user.review_stats?.total_reviews;
      if (avgRating && totalReviews > 0) {
        jsonLd.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Number(avgRating).toFixed(1),
          reviewCount: totalReviews,
          bestRating: '5',
          worstRating: '1',
        };
      }
    }
  } catch {
    // Fail silently
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
