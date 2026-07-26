import { getSiteOrigin } from '@/lib/site-url';
import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from './blog/posts';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Dynamic sitemap — static + programmatic URLs + listings from the API.
 *
 * Excluded by design: auth pages (/login, /register — noindex), auth-only
 * shells (/home, /profile, /messages, /owner, /nearby), and the bare /search
 * landing (parameterized variants are blocked in robots.txt).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteOrigin();
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
      priority: 0.95,
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
    {
      url: `${baseUrl}/indices-loyers`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  // ── Programmatic city pages ───────────────────────────────────
  const cities = [
    'douala',
    'yaounde',
    'bafoussam',
    'abidjan',
    'cotonou',
    'lome',
    'accra',
    'dakar',
    'bamako',
  ];
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/immobilier/${city}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const countryPages: MetadataRoute.Sitemap = [
    'cameroun',
    'cote-divoire',
    'benin',
    'togo',
    'senegal',
  ].map((slug) => ({
    url: `${baseUrl}/immobilier/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // ── Property-type pages ──────────────────────────────────────
  const propertyTypes = [
    'appartement',
    'maison',
    'villa',
    'terrain',
    'bureau',
    'studio',
  ];
  const typePages: MetadataRoute.Sitemap = propertyTypes.map((type) => ({
    url: `${baseUrl}/type-bien/${type}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  // ── Comparison pages ─────────────────────────────────────────
  const comparisonSlugs = [
    'louer-vs-acheter',
    'douala-vs-yaounde',
    'appartement-vs-maison',
  ];
  const comparisonPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/comparaison`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    },
    ...comparisonSlugs.map((slug) => ({
      url: `${baseUrl}/comparaison/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
  ];

  // ── Blog pages ───────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date || now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
  ];

  // ── Dynamic ad pages from the API ───────────────────────────────
  let adPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/ads?per_page=5000&status=available`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error(
        `sitemap: ads fetch failed with status ${res.status} — listings excluded from sitemap`
      );
    } else {
      const json = await res.json();
      const ads: Array<{ id: string; slug?: string; updated_at?: string }> =
        json.data ?? [];
      if (ads.length === 0) {
        console.warn(
          'sitemap: ads endpoint returned 0 listings — check API status=available filter'
        );
      }
      adPages = ads.map((ad) => ({
        url: `${baseUrl}/ads/${ad.slug || ad.id}`,
        lastModified: ad.updated_at || now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('sitemap: ads fetch threw:', error);
  }

  // ── Agency profile pages ─────────────────────────────────────────
  let agencyPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/agencies?per_page=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error(`sitemap: agencies fetch failed with status ${res.status}`);
    } else {
      const json = await res.json();
      const agencies: Array<{ id: string; updated_at?: string }> =
        json.data ?? [];
      agencyPages = agencies.map((agency) => ({
        url: `${baseUrl}/agences/${agency.id}`,
        lastModified: agency.updated_at || now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('sitemap: agencies fetch threw:', error);
  }

  // ── Bailleur (landlord) public profile pages ──────────────────────
  let landlordPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${API_URL}/users?role=agent&per_page=500&public=true`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error(
        `sitemap: landlords fetch failed with status ${res.status}`
      );
    } else {
      const json = await res.json();
      const users: Array<{
        username?: string;
        id: string;
        updated_at?: string;
      }> = json.data ?? [];
      landlordPages = users
        .filter((u) => u.username)
        .map((u) => ({
          url: `${baseUrl}/bailleurs/${u.username}`,
          lastModified: u.updated_at || now,
          changeFrequency: 'weekly' as const,
          priority: 0.55,
        }));
    }
  } catch (error) {
    console.error('sitemap: landlords fetch threw:', error);
  }

  return [
    ...staticPages,
    ...countryPages,
    ...cityPages,
    ...typePages,
    ...comparisonPages,
    ...blogPages,
    ...adPages,
    ...agencyPages,
    ...landlordPages,
  ];
}
