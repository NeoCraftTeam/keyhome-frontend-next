import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Dynamic sitemap — includes static pages + all public ad listings.
 * Auth-gated pages (/home, /nearby, /login, /register) are excluded
 * since they either can't be crawled or have low SEO value.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://keyhome.app';
  const now = new Date().toISOString();

  // ── Static pages ────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/conditions`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Programmatic city pages ───────────────────────────────────
  const cities = ['douala', 'yaounde', 'bafoussam', 'abidjan', 'cotonou', 'lome', 'accra', 'dakar', 'bamako'];
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/immobilier/${city}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // ── Blog pages ───────────────────────────────────────────────
  const blogSlugs = ['eviter-arnaques-immobilieres-cameroun', 'prix-loyers-douala-2026', 'location-appartement-abidjan-guide'];
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // ── Dynamic ad pages from the API ───────────────────────────────
  let adPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/ads?per_page=5000&status=available`, {
      next: { revalidate: 3600 }, // re-fetch at most once per hour
    });
    if (res.ok) {
      const json = await res.json();
      const ads = json.data ?? [];
      adPages = ads.map(
        (ad: { id: string; slug?: string; updated_at?: string }) => ({
          url: `${baseUrl}/ads/${ad.id}/${ad.slug || ad.id}`,
          lastModified: ad.updated_at || now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }),
      );
    }
  } catch {
    // Fail silently — static pages are always included even if the API is down
  }

  return [...staticPages, ...cityPages, ...blogPages, ...adPages];
}
