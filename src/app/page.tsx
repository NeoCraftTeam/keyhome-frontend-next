import LandingPage from '@/components/landing/LandingPage';

/**
 * Root page — rendered as a Server Component so that all static marketing
 * content (H1, descriptions, CTA) is present in the initial HTML for SEO.
 *
 * Authenticated users are redirected to /home by the Clerk middleware
 * (src/middleware.ts) at the edge, before this page ever renders.
 */
export default function RootPage() {
  return <LandingPage />;
}


