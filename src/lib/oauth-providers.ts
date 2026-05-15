import { OAuthProvider } from '@/services/auth.service';

/**
 * Default OAuth icons match production Clerk (Google + Facebook + GitHub). Hide
 * GitHub when it is disabled in Clerk: `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED=false`.
 */
export function getConfiguredOAuthProviders(): OAuthProvider[] {
  const list: OAuthProvider[] = ['google', 'facebook'];
  const githubExplicitlyDisabled =
    process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === 'false';
  if (!githubExplicitlyDisabled) {
    list.push('github');
  }
  return list;
}
