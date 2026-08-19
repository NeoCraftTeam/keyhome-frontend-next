/**
 * OAuth redirect targets — single source of truth for Clerk custom OAuth flows.
 * Owner flows must never fall back to client `/login` or `/home`.
 */

import { defaultDestination, peekReturnTo } from '@/lib/auth/return-to';

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

/**
 * Post-OAuth landing path.
 *
 * Prefers the destination the visitor was trying to reach before being sent to
 * the auth flow; falls back to the space's home when there is none (direct
 * visit to the login page). The stored value is validated and context-checked
 * by `peekReturnTo`, so an owner is never handed a client path.
 *
 * Note this only *reads* the value: the consumer is whoever performs the final
 * navigation, so a timed-out fallback and the normal path agree on the target.
 */
export function getOAuthFallbackPath(context: OAuthPanelContext): string {
  return peekReturnTo(context) ?? defaultDestination(context);
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
