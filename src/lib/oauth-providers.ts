import { OAuthProvider } from '@/services/auth.service';

/**
 * GitHub OAuth via Clerk is optional — many instances do not enable it; exposing
 * the button without configuration causes noisy runtime errors. Enable explicitly
 * with `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED=true` after enabling GitHub in Clerk.
 */
export function getConfiguredOAuthProviders(): OAuthProvider[] {
  const list: OAuthProvider[] = ['google', 'facebook'];
  if (process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === 'true') {
    list.push('github');
  }
  return list;
}
