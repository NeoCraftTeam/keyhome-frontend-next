'use client';

import OwnerBottomNav, {
  OWNER_BOTTOM_NAV_HEIGHT,
} from '@/components/owner/OwnerBottomNav';
import OwnerNavbar from '@/components/owner/OwnerNavbar';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
} from '@/components/owner/owner-constants';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import SurveyPromptOrBanner from '@/components/surveys/SurveyPromptOrBanner';
import {
  getSurveyPostponed,
  setSurveyPostponed as persistSurveyPostponed,
} from '@/components/surveys/SurveyBanner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PageTransition from '@/components/ui/PageTransition';
import { shouldShowOwnerQuickCreateFab } from '@/lib/owner-shell-fab';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { surveysService } from '@/services/surveys.service';
import { UserRole } from '@/types';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Drawer, Fab, useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const OWNER_PUBLIC_PATHS = [
  '/owner/login',
  '/owner/register',
  '/owner/forgot-password',
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
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [surveyPostponed, setSurveyPostponed] = useState<
    Record<string, boolean>
  >({});
  const [surveyMounted, setSurveyMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const collapsed =
      localStorage.getItem('owner-sidebar-collapsed') === 'true';
    setSidebarCollapsed(collapsed);
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

  const { data: activeSurvey, isError: activeSurveyError } = useQuery({
    queryKey: ['active-survey-owner', isAuthenticated],
    queryFn: () => surveysService.getActive(),
    enabled: isAuthenticated && !publicRoute,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeSurveyId = activeSurvey?.id ?? null;

  const { data: surveyAnsweredData } = useQuery({
    queryKey: ['survey-has-answered-owner', activeSurveyId, isAuthenticated],
    queryFn: () => surveysService.hasAnswered(activeSurveyId!),
    enabled: isAuthenticated && !publicRoute && !!activeSurveyId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    setSurveyMounted(true);
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

  useEffect(() => {
    if (isLoading) return;
    if (publicRoute) return;

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
    if (user.role && !OWNER_ALLOWED_ROLES.includes(user.role)) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, user, pathname, publicRoute, router]);

  if (publicRoute) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    );
  }

  if (isLoading) {
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
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Sidebar — MUI Drawer permanent (desktop) / temporary (mobile via Navbar) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            mt: 0,
            top: 0,
            height: '100vh',
            transition: 'width 0.2s ease',
            overflowX: 'hidden',
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
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <OwnerNavbar />
        <Box
          sx={{
            flex: 1,
            display: 'block',
            pb: isMobile ? `${OWNER_BOTTOM_NAV_HEIGHT}px` : 3,
            px: { xs: 2, md: 3 },
          }}
        >
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </Box>
        <OwnerBottomNav />
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
            bottom: OWNER_BOTTOM_NAV_HEIGHT + 16,
            right: 16,
            zIndex: (t) => t.zIndex.appBar,
            boxShadow: 4,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {surveyMounted &&
        isAuthenticated &&
        !publicRoute &&
        !isSurveyPage &&
        !activeSurveyError &&
        activeSurvey &&
        surveyAnsweredData?.has_answered === false && (
          <SurveyPromptOrBanner
            surveyId={activeSurvey.id}
            surveySlug={activeSurvey.slug}
            title="Votre avis compte !"
            description={
              activeSurvey.description ??
              'Aidez-nous à améliorer KeyHome en répondant à quelques questions.'
            }
            onPostponed={async () => {
              setSurveyPostponed((p) => ({ ...p, [activeSurvey.id]: true }));
              if (user) {
                const ids = user.preferences?.survey_postponed_ids ?? [];
                if (!ids.includes(activeSurvey.id)) {
                  try {
                    await authService.updatePreferences({
                      survey_postponed_ids: [...ids, activeSurvey.id],
                    });
                    await refreshUser();
                  } catch {
                    /* ignore */
                  }
                }
              } else {
                persistSurveyPostponed(activeSurvey.id);
              }
            }}
            isPostponed={
              surveyPostponed[activeSurvey.id] ??
              getSurveyPostponed(activeSurvey.id, user)
            }
            bottomOffset={OWNER_BOTTOM_NAV_HEIGHT}
          />
        )}
    </Box>
  );
}
