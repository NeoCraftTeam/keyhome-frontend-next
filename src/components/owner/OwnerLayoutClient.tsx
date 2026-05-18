'use client';

import KeyHomeClarityIdentity from '@/components/analytics/KeyHomeClarityIdentity';
import { ChatNotificationListener } from '@/components/chat/ChatNotificationListener';
import { GlobalPresenceChannel } from '@/components/chat/GlobalPresenceChannel';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
} from '@/components/owner/owner-constants';
import OwnerBottomNav, {
  OWNER_BOTTOM_NAV_HEIGHT,
} from '@/components/owner/OwnerBottomNav';
import OwnerNavbar from '@/components/owner/OwnerNavbar';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import OwnerWelcomeModal from '@/components/owner/OwnerWelcomeModal';
import SessionTimeoutGuard from '@/components/session/SessionTimeoutGuard';
import SurveyLoginModal from '@/components/surveys/SurveyLoginModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import PageTransition from '@/components/ui/PageTransition';
import PushPrompt from '@/components/ui/PushPrompt';
import { useFcmToken } from '@/hooks/useFcmToken';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { isLikelyIosWebKit } from '@/lib/ios-environment';
import { shouldShowOwnerQuickCreateFab } from '@/lib/owner-shell-fab';
import { khLeftRailPaddingSx } from '@/lib/safe-area-insets';
import { useAuth } from '@/providers/AuthProvider';
import { surveysService } from '@/services/surveys.service';
import { brandAgent } from '@/theme/tokens';
import { UserRole } from '@/types';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Drawer, Fab, useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function FcmRegistrar() {
  useFcmToken();
  return null;
}

const OWNER_PUBLIC_PATHS = [
  '/owner/login',
  '/owner/register',
  '/owner/forgot-password',
  '/owner/auth',
];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return OWNER_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export default function OwnerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  // Dismissed only for this login session — resets to false when isAuthenticated
  // transitions true so the modal re-appears on every new login.
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Survey is gated until PushPrompt step resolves (accepted, dismissed, or not applicable).
  // For returning users (onboarding already completed) it's immediately ready.
  const [pushPromptReady, setPushPromptReady] = useState(false);
  /** Becomes true once the onboarding tour / WelcomeModal has dismissed.
   * Prevents the survey from appearing before the tour sequence completes.
   * Returning users (onboarding_completed_at set) are treated as tour-done immediately. */
  const [tourDismissed, setTourDismissed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(
      localStorage.getItem('owner-sidebar-collapsed') === 'true'
    );
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('owner-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const publicRoute = isPublicPath(pathname);
  const isSurveyPage =
    pathname?.startsWith('/surveys') || pathname?.startsWith('/sondage');

  const isOwnerConversationPage = /^\/owner\/messages\/[^/]+/.test(
    pathname ?? ''
  );
  const isOwnerMessagesPage = pathname?.startsWith('/owner/messages') ?? false;
  const hideNavForChat = isMobile && isOwnerConversationPage;

  // Mobile chat (non‑iOS): lock document scroll. iOS: skip — see interactive-widget note above.
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

  const { data: activeSurvey, isError: activeSurveyError } = useQuery({
    queryKey: ['active-survey-owner', isAuthenticated],
    queryFn: ({ signal }) => surveysService.getActive({ signal }),
    enabled: isAuthenticated && !publicRoute,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeSurveyId = activeSurvey?.id ?? null;

  const { data: surveyAnsweredData } = useQuery({
    queryKey: ['survey-has-answered-owner', activeSurveyId, isAuthenticated],
    queryFn: ({ signal }) =>
      surveysService.hasAnswered(activeSurveyId!, { signal }),
    enabled: isAuthenticated && !publicRoute && !!activeSurveyId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Reset dismissed flag on every new login so the modal re-appears.
  useEffect(() => {
    if (isAuthenticated) {
      setSurveyDismissed(false);
    }
  }, [isAuthenticated]);

  // Tour-dismissed gate: returning users are ready immediately; new users wait
  // for kh:welcome-dismissed (fired 3 s after OwnerWelcomeModal closes).
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
  useEffect(() => {
    const handler = () => setPushPromptReady(true);
    window.addEventListener('kh:push-prompt-done', handler);
    return () => window.removeEventListener('kh:push-prompt-done', handler);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    // Wait for pathname to be resolved before making any redirect decisions
    if (!pathname) return;
    if (publicRoute) return;

    if (isLoggingOut) {
      return;
    }

    if (!isAuthenticated || !user) {
      sessionStorage.setItem(
        'kh_owner_redirect',
        pathname || '/owner/dashboard'
      );
      router.replace('/owner/login');
      return;
    }

    // Only agents and admins may access the owner panel
    const OWNER_ALLOWED_ROLES = [UserRole.AGENT, UserRole.ADMIN];
    if (!user.role || !OWNER_ALLOWED_ROLES.includes(user.role)) {
      router.replace('/home');
    }
  }, [
    isAuthenticated,
    isLoading,
    isLoggingOut,
    user,
    pathname,
    publicRoute,
    router,
  ]);

  if (publicRoute) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    );
  }

  // Wait for pathname to be resolved before making auth decisions
  if (!pathname || isLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loading-teal.svg" alt="Chargement…" width={48} height={48} />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    if (isLoggingOut) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <LogoutOverlay />
        </Box>
      );
    }
    return null;
  }

  const OWNER_ALLOWED_ROLES = [UserRole.AGENT, UserRole.ADMIN];
  if (!user.role || !OWNER_ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        // Messages pages need fixed height so flex children can fill correctly;
        // other pages use minHeight to allow natural scrolling.
        ...(isOwnerMessagesPage
          ? { height: '100dvh', overflow: 'hidden' }
          : { minHeight: '100vh' }),
        bgcolor: 'background.default',
      }}
    >
      {/* Always-mounted realtime listeners for the owner panel:
          presence (online/last seen) and chat toast notifications.
          ChatNotificationListener uses the teal owner accent. */}
      <GlobalPresenceChannel />
      <KeyHomeClarityIdentity />
      <FcmRegistrar />
      <ChatNotificationListener
        basePath="/owner/messages"
        accentColor={brandAgent.primary}
      />

      {/* Sidebar — MUI Drawer permanent (desktop) / temporary (mobile via Navbar) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            mt: 0,
            top: 0,
            height: '100vh',
            transition: 'width 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
            overflowX: 'hidden',
            // Fixed rail: extend under notch using env + measured top inset (viewport-fit=cover).
            padding: khLeftRailPaddingSx,
            // Shell chrome: avoid iOS callout menu on long-press over nav labels.
            userSelect: 'none',
            WebkitUserSelect: 'none',
          },
        }}
      >
        <OwnerSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      </Drawer>

      {/* Main content area */}
      <Box
        aria-label="Contenu principal"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          ...(isOwnerMessagesPage ? { minHeight: 0 } : { minHeight: '100vh' }),
        }}
      >
        {!hideNavForChat && <OwnerNavbar />}
        <Box
          sx={{
            flex: 1,
            ...(isOwnerMessagesPage
              ? {
                  // Messages pages: absolute-positioned inner wrapper guarantees
                  // a definite height context for the chat flex chain.
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'block',
                  px: 0,
                  pb: 0,
                }
              : {
                  display: 'block',
                  pb:
                    isMobile && isStandalone
                      ? `${OWNER_BOTTOM_NAV_HEIGHT}px`
                      : 3,
                  px: { xs: 2, md: 3 },
                }),
          }}
        >
          {isOwnerMessagesPage ? (
            <Box
              sx={{
                // `fixed` (not absolute) when the immersive chat is shown on
                // mobile keeps the chat anchored to the visual viewport on iOS
                // even while the keyboard is open.
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
        {!hideNavForChat && <OwnerBottomNav />}
      </Box>

      {/* FAB : nouvelle annonce — liste annonces uniquement (pas sur le tableau de bord) */}
      {isMobile && shouldShowOwnerQuickCreateFab(pathname) && (
        <Fab
          color="primary"
          size="medium"
          aria-label="Nouvelle annonce"
          onClick={() => router.push('/owner/ads/new')}
          sx={{
            position: 'fixed',
            bottom: isStandalone ? OWNER_BOTTOM_NAV_HEIGHT + 16 : 24,
            right: 16,
            zIndex: (t) => t.zIndex.appBar,
            boxShadow: 4,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <SurveyLoginModal
        open={
          isAuthenticated &&
          !publicRoute &&
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
        title="Votre avis compte !"
        description={
          activeSurvey?.description ??
          'Aidez-nous à améliorer KeyHome pour les bailleurs en répondant à quelques questions.'
        }
        onDismiss={() => setSurveyDismissed(true)}
      />

      {/* Onboarding flow: WelcomeModal → PushPrompt → Survey */}
      <PushPrompt />
      <OwnerWelcomeModal />

      {/* Session idle timeout — must live inside OwnerThemeProvider so the modal
          inherits the teal palette, mirroring the dashboard layout pattern. */}
      {isAuthenticated && <SessionTimeoutGuard />}
    </Box>
  );
}
