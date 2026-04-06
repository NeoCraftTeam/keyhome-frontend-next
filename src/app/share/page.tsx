import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface SharePageProps {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
}

/**
 * PWA Web Share Target handler.
 * Registered in manifest.json as share_target.action = "/share".
 * When an Android user taps "Partager → KeyHome", the browser navigates here
 * with ?title=&text=&url= query params populated from the shared content.
 *
 * Strategy:
 *  1. Shared URL looks like an internal ad → go directly to the ad page
 *  2. Any other text → redirect to /search with it as the query
 *  3. Fallback → /search
 */
export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const sharedUrl = (params.url ?? '').trim();
  const sharedText = (params.title ?? params.text ?? '').trim();

  // 1. Detect internal ad URL shared from another KeyHome page
  if (sharedUrl) {
    try {
      const parsed = new URL(sharedUrl);
      const adMatch = parsed.pathname.match(/^\/ads\/([^/]+)$/);
      if (adMatch) {
        redirect(`/ads/${adMatch[1]}`);
      }
      // Any other keyhome.app path → follow it directly
      if (
        parsed.hostname === 'keyhome.app' ||
        parsed.hostname.endsWith('.keyhome.app')
      ) {
        redirect(parsed.pathname + parsed.search);
      }
    } catch {
      // Not a valid absolute URL — treat as text
    }
  }

  // 2. Use shared text as search query
  if (sharedText) {
    redirect(`/search?q=${encodeURIComponent(sharedText)}`);
  }

  // 3. Fallback
  redirect('/search');
}
