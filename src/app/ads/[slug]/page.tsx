import type { Metadata } from 'next';
import AdDetailClient from './AdDetailClient';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Server-side metadata generation for ad detail pages.
 *
 * Fetches the ad from the API at build/request time to populate
 * <title>, OpenGraph, and Twitter tags for SEO and social sharing.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_URL}/ads/${slug}`, {
      next: { revalidate: 60 }, // cache for 60s
    });

    if (!res.ok) {
      return { title: 'Annonce | KeyHome' };
    }

    const json = await res.json();
    const ad = json.data ?? json;

    const title = ad.title || 'Annonce';
    const city = ad.quarter?.city_name || '';
    const quarter = ad.quarter?.name || '';
    const location = [quarter, city].filter(Boolean).join(', ');
    const price = ad.price
      ? `${Number(ad.price).toLocaleString('fr-FR')} FCFA`
      : '';
    const description =
      ad.description?.slice(0, 160) ||
      `${title}${location ? ` à ${location}` : ''}${price ? ` — ${price}` : ''}. Annonce vérifiée sur KeyHome.`;

    const primaryImage =
      ad.images?.find((img: { is_primary?: boolean }) => img.is_primary) ||
      ad.images?.[0];
    const imageUrl = primaryImage?.url || '/images/og-cover.png';

    return {
      title: `${title}${location ? ` — ${location}` : ''}`,
      description,
      openGraph: {
        type: 'article',
        title: `${title}${price ? ` — ${price}` : ''}`,
        description,
        url: `https://keyhome.app/ads/${slug}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        siteName: 'KeyHome',
        locale: 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title}${price ? ` — ${price}` : ''}`,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `https://keyhome.app/ads/${slug}`,
      },
    };
  } catch {
    return { title: 'Annonce | KeyHome' };
  }
}

/**
 * Fetches ad data server-side and injects RealEstateListing JSON-LD
 * for rich snippets in Google SERPs. The page is publicly accessible
 * (outside the auth-gated dashboard layout) so Googlebot can crawl it.
 */
export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch ad data server-side for JSON-LD structured data
  let adJsonLd: React.JSX.Element | null = null;
  try {
    const res = await fetch(`${API_URL}/ads/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      const ad = json.data ?? json;

      const city = ad.quarter?.city_name || '';
      const quarter = ad.quarter?.name || '';
      const country = ad.quarter?.country_code || 'CM';
      const images = ad.images?.map((img: { url: string }) => img.url) || [];

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: ad.title,
        description: ad.description?.slice(0, 300),
        url: `https://keyhome.app/ads/${slug}`,
        datePosted: ad.created_at,
        image: images,
        address: {
          '@type': 'PostalAddress',
          addressLocality: city,
          addressRegion: quarter,
          addressCountry: country,
        },
        ...(ad.price && {
          offers: {
            '@type': 'Offer',
            price: String(ad.price),
            priceCurrency: 'XAF',
            availability: 'https://schema.org/InStock',
          },
        }),
        ...(ad.surface_area && {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: ad.surface_area,
            unitCode: 'MTK',
          },
        }),
        ...(ad.bedrooms && { numberOfRooms: ad.bedrooms }),
        ...(ad.rating != null &&
          (ad.reviews_count ?? 0) > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(ad.rating).toFixed(1),
              reviewCount: ad.reviews_count,
              bestRating: '5',
              worstRating: '1',
            },
          }),
        ...(ad.has_3d_tour &&
          ad.tour_config?.scenes?.length && {
            video: {
              '@type': 'VideoObject',
              name: `Visite 360° — ${ad.title}`,
              description: `Visitez virtuellement ce bien immobilier : ${ad.title}`,
              thumbnailUrl: images[0] ?? '/images/og-cover.png',
              contentUrl:
                ad.tour_config.scenes[0]?.image_url ??
                images[0] ??
                '/images/og-cover.png',
              uploadDate: ad.created_at,
            },
          }),
      };

      adJsonLd = (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      );
    }
  } catch {
    // Fail silently — the page still renders, just without JSON-LD
  }

  return (
    <>
      {adJsonLd}
      <AdDetailClient />
    </>
  );
}
