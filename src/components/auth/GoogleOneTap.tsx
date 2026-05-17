'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useClerk } from '@clerk/nextjs';
import type {
  CredentialResponse,
  PromptMomentNotification,
} from 'google-one-tap';
import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

/** Sentinel ID — IntersectionObserver watches this to detect when the
 *  component is truly visible (not hidden behind splash / overlay). */
const SENTINEL_ID = 'google-one-tap-sentinel';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Module-level sentinel: google.accounts.id.initialize() must be called only
 * once per page load. A component-level ref resets on unmount/remount (e.g.
 * when the auth-layout splash transition swaps subtrees), causing the
 * "initialize() called multiple times" GSI warning. A module variable persists
 * for the lifetime of the page regardless of React re-renders.
 */
let gsiPageInitialized = false;

/**
 * Renders the Google One Tap prompt on the client-facing login page.
 *
 * Design decisions:
 * - Only activated when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 * - Skipped entirely if the user is already authenticated.
 * - Authenticates through Clerk (authenticateWithGoogleOneTap +
 *   handleGoogleOneTapCallback) to remain consistent with the existing
 *   Clerk → Sanctum exchange flow handled by AuthProvider.
 * - Uses window.location.href (full page reload) after sign-in so that
 *   AuthProvider re-initializes and completes the Clerk→Sanctum exchange
 *   before rendering protected pages. router.push is insufficient here
 *   because it is client-side and Sanctum exchange may not have finished.
 * - auto_select: true — auto-signs in when there is exactly one Google
 *   account in the browser with an active session (no extra click needed).
 * - NOT included on /owner/login — new users via One Tap are always
 *   created as CUSTOMER; agents must register via the owner flow.
 * - GSI script loaded with strategy="afterInteractive" to avoid
 *   blocking the page paint.
 * - Single initialization path: onLoad fires when GSI is ready, then
 *   initializes + prompts once. useEffect only handles cleanup.
 */
export function GoogleOneTap() {
  const clerk = useClerk();
  const { isAuthenticated } = useAuth();
  const initializedRef = useRef(false);
  const promptFiredRef = useRef(false);

  const handleCredential = useCallback(
    async ({ credential }: CredentialResponse) => {
      if (process.env.NODE_ENV === 'development')
        console.log('[GoogleOneTap] 1 — credential received');
      try {
        const res = await clerk.authenticateWithGoogleOneTap({
          token: credential,
        });

        if (process.env.NODE_ENV === 'development')
          console.log('[GoogleOneTap] 2 — result:', res.status);

        if (res.status === 'complete' && res.createdSessionId) {
          if (process.env.NODE_ENV === 'development')
            console.log('[GoogleOneTap] 3 — calling setActive…');
          await clerk.setActive({ session: res.createdSessionId });
          if (process.env.NODE_ENV === 'development')
            console.log('[GoogleOneTap] 4 — setActive OK');
          window.location.href = '/home';
          return;
        }

        if (process.env.NODE_ENV === 'development')
          console.warn('[GoogleOneTap] non-complete status, using fallback');
        await clerk.handleGoogleOneTapCallback(
          res,
          {
            signInFallbackRedirectUrl: '/home',
            signUpFallbackRedirectUrl: '/home',
          },
          async (to: string) => {
            if (process.env.NODE_ENV === 'development')
              console.log('[GoogleOneTap] fallback navigate to:', to);
            window.location.href = to || '/home';
          }
        );
      } catch (err) {
        console.error('[GoogleOneTap] ERROR:', err);
        window.google?.accounts.id.cancel();
      }
    },
    [clerk]
  );

  /** firePrompt — calls prompt() only when component is truly visible.
   *  Called by IntersectionObserver once the sentinel enters the viewport
   *  (intersection ratio > 0 only when no ancestor has visibility:hidden). */
  const firePrompt = useCallback(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      isAuthenticated ||
      !initializedRef.current ||
      promptFiredRef.current ||
      !window.google?.accounts?.id
    )
      return;

    promptFiredRef.current = true;

    // With use_fedcm_for_prompt the notification callback is not invoked for
    // display/skipped moments (FedCM owns that UI). Only pass it in dev so the
    // deprecation warning from the GSI script is not emitted in production.
    window.google.accounts.id.prompt(
      process.env.NODE_ENV === 'development'
        ? (notification: PromptMomentNotification) => {
            if (notification.isNotDisplayed()) {
              console.warn(
                '[GoogleOneTap] Not displayed:',
                notification.getNotDisplayedReason()
              );
            } else if (notification.isSkippedMoment()) {
              console.warn(
                '[GoogleOneTap] Skipped:',
                notification.getSkippedReason()
              );
            } else if (notification.isDismissedMoment()) {
              console.info(
                '[GoogleOneTap] Dismissed:',
                notification.getDismissedReason()
              );
            } else {
              console.info('[GoogleOneTap] Displayed ✓');
            }
          }
        : undefined
    );
  }, [isAuthenticated]);

  /** initGsi — called from Script onLoad. Initializes the GSI client only;
   *  does NOT call prompt() directly. The IntersectionObserver effect below
   *  calls firePrompt() once the sentinel is actually visible, preventing the
   *  popup from appearing while the auth layout splash overlay is active. */
  const initGsi = useCallback(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      isAuthenticated ||
      gsiPageInitialized ||
      !window.google?.accounts?.id
    )
      return;

    gsiPageInitialized = true;
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: true,
      cancel_on_tap_outside: true,
      itp_support: true,
      // Opt into FedCM to suppress deprecation warnings for display_moment /
      // skipped_moment. When FedCM becomes mandatory this flag will already
      // be set. The credential callback behaviour is unchanged.
      use_fedcm_for_prompt: true,
    });

    /* Attempt to prompt immediately — will be a no-op if the sentinel is not
       yet visible; the IntersectionObserver below fires the real prompt. */
    firePrompt();
  }, [handleCredential, isAuthenticated, firePrompt]);

  /** On mount: if the GSI script is already loaded (happens when the auth
   *  layout unmounts/remounts GoogleOneTap after the splash transition —
   *  Next.js caches the Script so onLoad never fires again on remount),
   *  call initGsi() directly so initialization is not skipped. */
  useEffect(() => {
    if (window.google?.accounts?.id && !initializedRef.current) {
      initGsi();
    }
  }, [initGsi]);

  /** IntersectionObserver — fires firePrompt() as soon as the sentinel enters
   *  the viewport. Elements with a visibility:hidden ancestor have intersection
   *  ratio = 0 (per spec), so this correctly defers the prompt until the
   *  splash overlay is dismissed and the login page is fully visible. */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isAuthenticated) return;

    const sentinel = document.getElementById(SENTINEL_ID);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          /* Ensure initialized in case initGsi() hasn't run yet */
          initGsi();
          firePrompt();
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isAuthenticated, firePrompt, initGsi]);

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
    <>
      {/* Sentinel — IntersectionObserver watches this 1px element.
          When the auth-layout splash overlay sets visibility:hidden on the
          ancestor, the intersection ratio is 0 and prompt() is deferred.
          Once the splash completes and the login page is visible, the
          observer fires firePrompt(). */}
      <span
        id={SENTINEL_ID}
        aria-hidden
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
      />
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGsi}
        data-testid="google-one-tap-script"
      />
    </>
  );
}
