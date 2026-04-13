'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useClerk } from '@clerk/nextjs';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import type {
  CredentialResponse,
  PromptMomentNotification,
} from 'google-one-tap';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Renders the Google One Tap prompt on the client-facing login page.
 *
 * Design decisions:
 * - Only activated when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 * - Skipped entirely if the user is already authenticated.
 * - Authenticates through Clerk (authenticateWithGoogleOneTap +
 *   handleGoogleOneTapCallback) to remain consistent with the existing
 *   Clerk → Sanctum exchange flow handled by AuthProvider.
 * - Uses Next.js client-side navigation via customNavigate (no full
 *   page reload on sign-in).
 * - NOT included on /owner/login — new users via One Tap are always
 *   created as CUSTOMER; agents must register via the owner flow.
 * - GSI script loaded with strategy="afterInteractive" to avoid
 *   blocking the page paint.
 * - Single initialization path: onLoad fires when GSI is ready, then
 *   initializes + prompts once. useEffect only handles cleanup.
 */
export function GoogleOneTap() {
  const clerk = useClerk();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const initializedRef = useRef(false);

  const handleCredential = useCallback(
    async ({ credential }: CredentialResponse) => {
      try {
        const res = await clerk.authenticateWithGoogleOneTap({
          token: credential,
        });
        await clerk.handleGoogleOneTapCallback(
          res,
          {
            signInFallbackRedirectUrl: '/home',
            signUpFallbackRedirectUrl: '/home',
          },
          async (to: string) => {
            router.push(to);
          }
        );
      } catch {
        window.google?.accounts.id.cancel();
      }
    },
    [clerk, router]
  );

  const initAndPrompt = useCallback(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      isAuthenticated ||
      initializedRef.current ||
      !window.google?.accounts?.id
    )
      return;

    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    window.google.accounts.id.prompt(
      (notification: PromptMomentNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          /* Silent — One Tap unavailable in this browser/context */
        }
      }
    );
  }, [handleCredential, isAuthenticated]);

  /* Cancel + reset if the user becomes authenticated while on the page */
  useEffect(() => {
    if (isAuthenticated) {
      window.google?.accounts.id.cancel();
      initializedRef.current = false;
    }
  }, [isAuthenticated]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      window.google?.accounts.id.cancel();
      initializedRef.current = false;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initAndPrompt}
      data-testid="google-one-tap-script"
    />
  );
}
