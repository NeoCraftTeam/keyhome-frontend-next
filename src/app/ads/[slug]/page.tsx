import { absoluteAssetUrl, absoluteUrl } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdDetailClient from './AdDetailClient';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Server-side metadata generation for ad detail pages.
 *
 * Fetches the ad from the API at build/request time to populate
 * <title>, OpenGraph, and Twitter tags for SEO and social sharing.
 * Returns HTTP 404 when the ad doesn't exist (instead of soft-404
 * with generic homepage metadata).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const res = await fetch(`${API_URL}/ads/${slug}`, {
    next: { revalidate: 300 },
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    console.error(
      `ads/[slug] generateMetadata: API ${res.status} for slug=${slug}`
    );
    notFound();
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

  const rawDesc: string =
    ad.description ||
    `${title}${location ? ` à ${location}` : ''}${price ? ` — ${price}` : ''}. Annonce vérifiée sur KeyHome.`;
  const description =
    rawDesc.length > 157
      ? rawDesc.slice(0, 157).replace(/\s+\S*$/, '') + '…'
      : rawDesc;

  const primaryImage =
    ad.images?.find((img: { is_primary?: boolean }) => img.is_primary) ||
    ad.images?.[0];
  const ogImage = absoluteAssetUrl(primaryImage?.url as string | undefined);

  return {
    title: `${title}${location ? ` — ${location}` : ''}`,
    description,
    openGraph: {
      type: 'article',
      title: `${title}${price ? ` — ${price}` : ''}`,
      description,
      url: absoluteUrl(`/ads/${slug}`),
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
      siteName: 'KeyHome',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title}${price ? ` — ${price}` : ''}`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: absoluteUrl(`/ads/${slug}`),
      languages: buildHreflangAlternates(absoluteUrl(`/ads/${slug}`)),
    },
    other: {
      ...(ad.location?.latitude != null &&
        ad.location?.longitude != null && {
          'geo.position': `${ad.location.latitude};${ad.location.longitude}`,
          ICBM: `${ad.location.latitude}, ${ad.location.longitude}`,
        }),
    },
  };
}

/**
 * Fetches ad data server-side and injects RealEstateListing JSON-LD
 * for rich snippets in Google SERPs. The page is publicly accessible
 * (outside the auth-gated dashboard layout) so Googlebot can crawl it.
 * Returns HTTP 404 when the ad doesn't exist.
 */
export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await fetch(`${API_URL}/ads/${slug}`, {
    next: { revalidate: 300 },
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    console.error(`ads/[slug] page: API ${res.status} for slug=${slug}`);
    notFound();
  }

  const json = await res.json();
  const ad = json.data ?? json;

  const city = ad.quarter?.city_name || '';
  const quarter = ad.quarter?.name || '';
  const country = ad.quarter?.country_code || 'CM';
  const images =
    (ad.images?.map((img: { url: string }) =>
      absoluteAssetUrl(img.url)
    ) as string[]) || [];

  const lat = ad.location?.latitude;
  const lng = ad.location?.longitude;

  const typeMap: Record<string, string> = {
    Appartement: 'Apartment',
    Studio: 'Apartment',
    Maison: 'SingleFamilyResidence',
    Villa: 'SingleFamilyResidence',
    Duplex: 'SingleFamilyResidence',
  };
  const subType = ad.type ? typeMap[ad.type] : undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': subType ? ['RealEstateListing', subType] : 'RealEstateListing',
    '@id': absoluteUrl(`/ads/${slug}#listing`),
    name: ad.title,
    description: ad.description?.slice(0, 300),
    url: absoluteUrl(`/ads/${slug}`),
    datePosted: ad.created_at,
    dateModified: ad.updated_at || ad.created_at,
    image: images,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: quarter,
      addressCountry: country,
    },
  };

  if (ad.transaction_type) {
    schema.propertyType = ad.transaction_type === 'rent' ? 'Rental' : 'ForSale';
  }

  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    };
  }

  if (ad.price) {
    schema.offers = {
      '@type': 'Offer',
      price: String(ad.price),
      priceCurrency: 'XAF',
      availability: 'https://schema.org/InStock',
    };
  }

  if (ad.surface_area) {
    schema.floorSize = {
      '@type': 'QuantitativeValue',
      value: ad.surface_area,
      unitCode: 'MTK',
    };
  }

  if (ad.bedrooms) {
    schema.numberOfRooms = ad.bedrooms;
  }

  if (ad.bathrooms) {
    schema.numberOfBathroomsTotal = ad.bathrooms;
  }

  if (ad.rating != null && (ad.reviews_count ?? 0) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(ad.rating).toFixed(1),
      reviewCount: ad.reviews_count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (ad.has_3d_tour && ad.tour_config?.scenes?.length) {
    schema.video = {
      '@type': 'VideoObject',
      name: `Visite 360° — ${ad.title}`,
      description: `Visitez virtuellement ce bien immobilier : ${ad.title}`,
      thumbnailUrl: images[0] ?? absoluteAssetUrl(null),
      contentUrl:
        ad.tour_config.scenes[0]?.image_url ??
        images[0] ??
        absoluteAssetUrl(null),
      uploadDate: ad.created_at,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <AdDetailClient />
    </>
  );
}
