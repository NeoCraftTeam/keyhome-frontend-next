/**
 * OAuth redirect targets — single source of truth for Clerk custom OAuth flows.
 * Owner flows must never fall back to client `/login` or `/home`.
 */

export type OAuthPanelContext = 'owner' | 'client';

export const KH_REGISTRATION_INTENT_KEY = 'kh_registration_intent';

export function isAgentRegistrationIntent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return sessionStorage.getItem(KH_REGISTRATION_INTENT_KEY) === 'agent';
}

export function oauthPanelContextFromIntent(
  registrationIntent?: 'customer' | 'agent'
): OAuthPanelContext {
  if (registrationIntent === 'agent') {
    return 'owner';
  }

  return isAgentRegistrationIntent() ? 'owner' : 'client';
}

export function getOAuthSignInPath(context: OAuthPanelContext): string {
  return context === 'owner' ? '/owner/login' : '/login';
}

export function getOAuthSignUpPath(context: OAuthPanelContext): string {
  return context === 'owner' ? '/register?role=agent' : '/register';
}

export function getOAuthFallbackPath(context: OAuthPanelContext): string {
  return context === 'owner' ? '/owner/dashboard' : '/home';
}

export function getOAuthCallbackPath(): string {
  return '/sso-callback';
}

export function getOAuthCallbackUrl(origin: string): string {
  return `${origin}${getOAuthCallbackPath()}`;
}

export function getOAuthFallbackUrl(
  origin: string,
  context: OAuthPanelContext
): string {
  return `${origin}${getOAuthFallbackPath(context)}`;
}
