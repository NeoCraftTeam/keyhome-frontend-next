'use client';

import BottomNav, { BOTTOM_NAV_HEIGHT } from '@/components/layout/BottomNav';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import SurveyPromptOrBanner from '@/components/surveys/SurveyPromptOrBanner';
import {
  getSurveyPostponed,
  setSurveyPostponed as persistSurveyPostponed,
} from '@/components/surveys/SurveyBanner';
import { authService } from '@/services/auth.service';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLoader from '@/components/ui/AppLoader';
import SkipLink from '@/components/ui/SkipLink';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import PageTransition from '@/components/ui/PageTransition';
import PushPrompt from '@/components/ui/PushPrompt';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { useAuth } from '@/providers/AuthProvider';
import { surveysService } from '@/services/surveys.service';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/** Silently warms up the geolocation cache on first visit so ad-detail maps are instant */
function LocationPrimer() {
  useUserLocation();
  return null;
}

/** Pages we never want to save as post-login redirect targets */
const AUTH_PAGES = [
  '/login',
  '/register',
  '/verify-otp',
  '/verify-email',
  '/complete-profile',
];

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
  const { isAuthenticated, isLoading, isLoggingOut, user, refreshUser } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const [surveyPostponed, setSurveyPostponed] = useState<
    Record<string, boolean>
  >({});
  const [surveyMounted, setSurveyMounted] = useState(false);
  // Survey is gated until PushPrompt step resolves (accepted, dismissed, or not applicable).
  // For returning users (onboarding already completed) it's immediately ready.
  const [pushPromptReady, setPushPromptReady] = useState(false);
  /** Becomes true once the WelcomeModal tour has dismissed (or immediately for returning users). */
  const [tourDismissed, setTourDismissed] = useState(false);

  const { data: activeSurvey, isError: activeSurveyError } = useQuery({
    queryKey: ['active-survey-global', isAuthenticated],
    queryFn: () => surveysService.getActive(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeSurveyId = activeSurvey?.id ?? null;

  const handleSurveyPostponed = useCallback(async () => {
    if (!activeSurveyId) return;
    setSurveyPostponed((p) => ({ ...p, [activeSurveyId]: true }));
    if (user) {
      const ids = user.preferences?.survey_postponed_ids ?? [];
      if (!ids.includes(activeSurveyId)) {
        try {
          await authService.updatePreferences({
            survey_postponed_ids: [...ids, activeSurveyId],
          });
          await refreshUser();
        } catch {
          /* ignore */
        }
      }
    } else {
      persistSurveyPostponed(activeSurveyId);
    }
  }, [activeSurveyId, user, refreshUser]);

  const { data: surveyAnsweredData } = useQuery({
    queryKey: ['survey-has-answered-global', activeSurveyId, isAuthenticated],
    queryFn: () => surveysService.hasAnswered(activeSurveyId!),
    enabled: isAuthenticated && !!activeSurveyId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    setSurveyMounted(true);
  }, []);

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

  useEffect(() => {
    if (
      activeSurvey?.id &&
      surveyMounted &&
      getSurveyPostponed(activeSurvey.id, user)
    ) {
      setSurveyPostponed((p) => ({ ...p, [activeSurvey.id]: true }));
    }
  }, [activeSurvey?.id, surveyMounted, user]);

  const isPrivatePage = PRIVATE_PATHS.some((p) => pathname?.startsWith(p));
  const isSurveyPage =
    pathname?.startsWith('/surveys') || pathname?.startsWith('/sondage');

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
  }, [
    isAuthenticated,
    isLoading,
    isLoggingOut,
    router,
    pathname,
    isPrivatePage,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <SkipLink />
      <LocationPrimer />
      <Navbar />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flex: 1,
          pb: isMobile && isStandalone ? `${BOTTOM_NAV_HEIGHT}px` : 0,
        }}
      >
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </Box>
      {!isMobile && <Footer />}
      <BottomNav />
      {surveyMounted &&
        isAuthenticated &&
        !isSurveyPage &&
        !activeSurveyError &&
        activeSurvey &&
        surveyAnsweredData?.has_answered === false &&
        pushPromptReady &&
        tourDismissed && (
          <SurveyPromptOrBanner
            surveyId={activeSurvey.id}
            surveySlug={activeSurvey.slug}
            title="Votre avis compte !"
            description={
              activeSurvey.description ??
              'Aidez-nous à améliorer KeyHome en répondant à quelques questions sur votre expérience.'
            }
            onPostponed={handleSurveyPostponed}
            isPostponed={
              surveyPostponed[activeSurvey.id] ??
              getSurveyPostponed(activeSurvey.id, user)
            }
            bottomOffset={BOTTOM_NAV_HEIGHT}
          />
        )}
      <PushPrompt />
      <WelcomeModal />
      <LogoutOverlay />
    </Box>
  );
}
