'use client';

import KeyHomeClarityIdentity from '@/components/analytics/KeyHomeClarityIdentity';
import { ChatNotificationListener } from '@/components/chat/ChatNotificationListener';
import { GlobalPresenceChannel } from '@/components/chat/GlobalPresenceChannel';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav, { BOTTOM_NAV_HEIGHT } from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import SessionTimeoutGuard from '@/components/session/SessionTimeoutGuard';
import SurveyLoginModal from '@/components/surveys/SurveyLoginModal';
import AppLoader from '@/components/ui/AppLoader';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import PageTransition from '@/components/ui/PageTransition';
import PushPrompt from '@/components/ui/PushPrompt';
import SkipLink from '@/components/ui/SkipLink';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { useFcmToken } from '@/hooks/useFcmToken';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useUserLocation } from '@/hooks/useUserLocation';
import { isLikelyIosWebKit } from '@/lib/ios-environment';
import { useAuth } from '@/providers/AuthProvider';
import ToastProvider from '@/providers/ToastProvider';
import { surveysService } from '@/services/surveys.service';
import { UserRole } from '@/types';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Silently warms up the geolocation cache on first visit so ad-detail maps are instant */
function LocationPrimer() {
  useUserLocation();
  return null;
}

/** Registers Firebase FCM token for push notifications (no-op if permission denied) */
function FcmRegistrar() {
  useFcmToken();
  return null;
}

/** Pages we never want to save as post-login redirect targets */
const AUTH_PAGES = ['/login', '/register', '/verify-otp', '/verify-email'];

/**
 * Routes within the dashboard group that require the user to be authenticated.
 * Public routes (/home, /nearby) are accessible to guests for read-only browsing.
 */
const PRIVATE_PATHS = [
  '/profile',
  '/my/reservations',
  '/notifications',
  '/publish',
  '/search-alerts',
  '/comparaisons',
  '/payments',
  '/messages',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isLoggingOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  // Dismissed only for this login session — resets to false when isAuthenticated
  // transitions true so the modal re-appears on every new login.
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  // Survey is gated until PushPrompt step resolves (accepted, dismissed, or not applicable).
  // For returning users (onboarding already completed) it's immediately ready.
  const [pushPromptReady, setPushPromptReady] = useState(false);
  /** Becomes true once the WelcomeModal tour has dismissed (or immediately for returning users). */
  const [tourDismissed, setTourDismissed] = useState(false);

  const { data: activeSurvey, isError: activeSurveyError } = useQuery({
    queryKey: ['active-survey'],
    queryFn: () => surveysService.getActive(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeSurveyId = activeSurvey?.id ?? null;

  const { data: surveyAnsweredData } = useQuery({
    queryKey: ['survey-has-answered', activeSurveyId],
    queryFn: () => surveysService.hasAnswered(activeSurveyId!),
    enabled: isAuthenticated && !!activeSurveyId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Reset dismissed flag on every new login so the modal re-appears.
  useEffect(() => {
    if (isAuthenticated) {
      setSurveyDismissed(false);
    }
  }, [isAuthenticated]);

  // Tour-dismissed gate: same logic as owner side.
  useEffect(() => {
    if (user?.onboarding_completed_at != null) {
      setTourDismissed(true);
      return;
    }
    const onDismissed = () => setTourDismissed(true);
    window.addEventListener('kh:welcome-dismissed', onDismissed, {
      once: true,
    });
    return () =>
      window.removeEventListener('kh:welcome-dismissed', onDismissed);
  }, [user?.onboarding_completed_at]);

  // Unlock survey once PushPrompt resolves (accept / dismiss / not applicable).
  // PushPrompt fires kh:push-prompt-done in all paths:
  //   - New users:      after kh:welcome-dismissed (3 s post-WelcomeModal) → user acts
  //   - Returning users: immediately when shouldShow=false (already subscribed / dismissed)
  // We do NOT unlock from onboarding_completed_at here — that would race against the
  // 3-second gap between WelcomeModal closing and PushPrompt appearing.
  useEffect(() => {
    const handler = () => setPushPromptReady(true);
    window.addEventListener('kh:push-prompt-done', handler);
    return () => window.removeEventListener('kh:push-prompt-done', handler);
  }, []);

  const isPrivatePage = PRIVATE_PATHS.some((p) => pathname?.startsWith(p));
  const isSurveyPage =
    pathname?.startsWith('/surveys') || pathname?.startsWith('/sondage');

  const isConversationPage = /^\/messages\/[^/]+/.test(pathname ?? '');
  const isMessagesPage = pathname?.startsWith('/messages') ?? false;
  const hideNavForChat = isMobile && isConversationPage;

  // Mobile chat (non‑iOS): lock root scroll so the keyboard does not shift the
  // shell. iOS uses `interactive-widget: resizes-content` — a fixed html/body
  // fights that and makes the whole page jump (see owner + root viewport).
  useEffect(() => {
    if (!hideNavForChat) return;
    if (isLikelyIosWebKit()) {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlPosition: html.style.position,
      htmlHeight: html.style.height,
      htmlWidth: html.style.width,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyHeight: body.style.height,
      bodyWidth: body.style.width,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.height = '100dvh';
    html.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = '0';
    body.style.left = '0';
    body.style.right = '0';
    body.style.height = '100dvh';
    body.style.width = '100%';
    body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.position = prev.htmlPosition;
      html.style.height = prev.htmlHeight;
      html.style.width = prev.htmlWidth;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.height = prev.bodyHeight;
      body.style.width = prev.bodyWidth;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, [hideNavForChat]);

  useEffect(() => {
    // Never redirect while the logout overlay is playing
    if (isLoggingOut) {
      return;
    }
    if (isPrivatePage && !isLoading && !isAuthenticated) {
      // Save where the user was so we can bring them back after re-auth
      const shouldSave =
        pathname &&
        !AUTH_PAGES.some((p) => pathname.startsWith(p)) &&
        pathname !== '/';
      if (shouldSave) {
        sessionStorage.setItem(
          'kh_redirect_after_login',
          pathname + window.location.search
        );
      }
      router.replace('/login');
    }

    // Cross-panel guard: owners/agents must not use client-private paths.
    // Redirect them to the owner dashboard instead.
    if (
      isPrivatePage &&
      !isLoading &&
      isAuthenticated &&
      user?.role === UserRole.AGENT
    ) {
      router.replace('/owner/dashboard');
    }
  }, [
    isAuthenticated,
    isLoading,
    isLoggingOut,
    router,
    pathname,
    isPrivatePage,
    user?.role,
  ]);

  // On first page load, wait until auth has fully resolved before rendering.
  // This prevents the flash of guest content (navbar, etc.) when a logged-in
  // user refreshes the page — we show loader until auth + user + balance are ready.
  const shouldHoldForAuth = isLoading;

  if (!isLoggingOut && shouldHoldForAuth) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoader />
      </Box>
    );
  }

  // Block rendering of private pages until auth is confirmed.
  // Exception: while logging out, keep the layout alive so LogoutOverlay stays mounted.
  if (!isLoggingOut && !isAuthenticated && isPrivatePage) {
    return null;
  }

  return (
    <ToastProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          // Messages pages need fixed height so flex children can fill correctly;
          // other pages use minHeight to allow natural scrolling.
          ...(isMessagesPage
            ? { height: '100dvh', overflow: 'hidden' }
            : { minHeight: '100vh' }),
          bgcolor: 'background.default',
        }}
      >
        <SkipLink />
        <LocationPrimer />
        {isAuthenticated && <FcmRegistrar />}
        {isAuthenticated && <KeyHomeClarityIdentity />}
        {isAuthenticated && <GlobalPresenceChannel />}
        {isAuthenticated && <ChatNotificationListener accentColor="#F6475F" />}
        {!hideNavForChat && <Navbar />}
        <Box
          sx={{
            flex: 1,
            minHeight: 0, // flex child trick: allow shrinking below content size
            ...(isMessagesPage
              ? {
                  // Messages pages: absolute-positioned inner wrapper guarantees
                  // a definite height context for the chat flex chain.
                  position: 'relative',
                  overflow: 'hidden',
                }
              : {
                  display: 'flex',
                  flexDirection: 'column',
                }),
            pb:
              !hideNavForChat && isMobile && isStandalone
                ? `${BOTTOM_NAV_HEIGHT}px`
                : 0,
          }}
        >
          {isMessagesPage ? (
            <Box
              sx={{
                // `fixed` (not absolute) on the chat detail page anchors the
                // chat to the visual viewport on iOS so the focused input
                // doesn't drag the layout. On larger screens (where there is
                // no immersive nav-hide), absolute is enough.
                position: hideNavForChat ? 'fixed' : 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <ErrorBoundary>
                <PageTransition>{children}</PageTransition>
              </ErrorBoundary>
            </Box>
          ) : (
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          )}
        </Box>
        {!isMobile && !isMessagesPage && <Footer />}
        {!hideNavForChat && <BottomNav />}
        <SurveyLoginModal
          open={
            isAuthenticated &&
            !isSurveyPage &&
            !activeSurveyError &&
            !!activeSurvey &&
            surveyAnsweredData?.has_answered === false &&
            pushPromptReady &&
            tourDismissed &&
            !surveyDismissed
          }
          surveyId={activeSurvey?.id ?? ''}
          surveySlug={activeSurvey?.slug}
          destPath={
            activeSurvey?.id ? `/sondage/${activeSurvey.id}` : undefined
          }
          title="Votre avis compte !"
          description={
            activeSurvey?.description ??
            'Aidez-nous à améliorer KeyHome en répondant à quelques questions sur votre expérience.'
          }
          onDismiss={() => setSurveyDismissed(true)}
        />
        <PushPrompt />
        <WelcomeModal />
        <LogoutOverlay />
        {isAuthenticated && <SessionTimeoutGuard />}
      </Box>
    </ToastProvider>
  );
}
