'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import SurveyPromptOrBanner from '@/components/surveys/SurveyPromptOrBanner';
import { getSurveyPostponed } from '@/components/surveys/SurveyBanner';
import AppLoader from '@/components/ui/AppLoader';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { useAuth } from '@/providers/AuthProvider';
import { surveysService } from '@/services/surveys.service';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Pages we never want to save as post-login redirect targets */
const AUTH_PAGES = ['/login', '/register', '/verify-otp', '/verify-email', '/complete-profile'];

/**
 * Routes within the dashboard group that require the user to be authenticated.
 * Public routes (/home, /nearby) are accessible to guests for read-only browsing.
 */
const PRIVATE_PATHS = ['/profile', '/my/reservations'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasStoredToken] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!window.localStorage.getItem('kh_sanctum_token');
    } catch {
      return false;
    }
  });
  const [surveyPostponed, setSurveyPostponed] = useState<Record<string, boolean>>({});
  const [surveyMounted, setSurveyMounted] = useState(false);

  const { data: activeSurvey, isError: activeSurveyError } = useQuery({
    queryKey: ['active-survey-global', isAuthenticated],
    queryFn: () => surveysService.getActive(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeSurveyId = activeSurvey?.id ?? null;

  const { data: surveyAnsweredData, isError: surveyAnsweredError } = useQuery({
    queryKey: ['survey-has-answered-global', activeSurveyId, isAuthenticated],
    queryFn: () => surveysService.hasAnswered(activeSurveyId!),
    enabled: isAuthenticated && !!activeSurveyId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    setSurveyMounted(true);
  }, []);

  useEffect(() => {
    if (activeSurvey?.id && surveyMounted && getSurveyPostponed(activeSurvey.id)) {
      setSurveyPostponed((p) => ({ ...p, [activeSurvey.id]: true }));
    }
  }, [activeSurvey?.id, surveyMounted]);

  const isPrivatePage = PRIVATE_PATHS.some((p) => pathname?.startsWith(p));
  const isSurveyPage = pathname?.startsWith('/surveys') || pathname?.startsWith('/sondage');

  useEffect(() => {
    // Never redirect while the logout overlay is playing
    if (isLoggingOut) { return; }
    if (isPrivatePage && !isLoading && !isAuthenticated) {
      // Save where the user was so we can bring them back after re-auth
      const shouldSave = pathname && !AUTH_PAGES.some(p => pathname.startsWith(p)) && pathname !== '/';
      if (shouldSave) {
        sessionStorage.setItem('kh_redirect_after_login', pathname + window.location.search);
      }
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isLoggingOut, router, pathname, isPrivatePage]);

  // On first page load, wait until we know whether a persisted token exists.
  // If one exists, keep waiting until auth finishes hydrating to avoid
  // guest-first flashes before the authenticated UI appears.
  const shouldHoldForBootstrap = hasStoredToken && isLoading;

  if (!isLoggingOut && (shouldHoldForBootstrap || (isLoading && isPrivatePage))) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoader size={48} />
      </Box>
    );
  }

  // Block rendering of private pages until auth is confirmed.
  // Exception: while logging out, keep the layout alive so LogoutOverlay stays mounted.
  if (!isLoggingOut && !isAuthenticated && isPrivatePage) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
      {surveyMounted && isAuthenticated && !isSurveyPage && !activeSurveyError && activeSurvey && surveyAnsweredData?.has_answered === false && (
        <SurveyPromptOrBanner
          surveyId={activeSurvey.id}
          surveySlug={activeSurvey.slug}
          title="Votre avis compte !"
          description={activeSurvey.description ?? "Aidez-nous à améliorer KeyHome en répondant à quelques questions sur votre expérience."}
          onPostponed={() => setSurveyPostponed((p) => ({ ...p, [activeSurvey.id]: true }))}
          isPostponed={surveyPostponed[activeSurvey.id] ?? getSurveyPostponed(activeSurvey.id)}
        />
      )}
      <WelcomeModal />
      <LogoutOverlay />
    </Box>
  );
}
