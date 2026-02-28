import type { Metadata } from 'next';
import AdDetailClient from './AdDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Server-side metadata generation for ad detail pages.
 *
 * Fetches the ad from the API at build/request time to populate
 * <title>, OpenGraph, and Twitter tags for SEO and social sharing.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;

  try {
    const res = await fetch(`${API_URL}/ads/${id}`, {
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

    const primaryImage = ad.images?.find((img: { is_primary?: boolean }) => img.is_primary) || ad.images?.[0];
    const imageUrl = primaryImage?.url || '/images/og-cover.png';

    return {
      title: `${title}${location ? ` — ${location}` : ''}`,
      description,
      openGraph: {
        type: 'article',
        title: `${title}${price ? ` — ${price}` : ''}`,
        description,
        url: `https://keyhome.app/ads/${id}/${slug}`,
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
        canonical: `https://keyhome.app/ads/${id}/${slug}`,
      },
    };
  } catch {
    return { title: 'Annonce | KeyHome' };
  }
}

export default function AdDetailPage() {
  return <AdDetailClient />;
}
