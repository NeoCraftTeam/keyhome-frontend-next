'use client';

import { usePasskeyLogin } from '@/hooks/usePasskey';
import {
  persistOwnerToken,
  persistClientToken,
  setRoleCookie,
} from '@/lib/auth-session';
import {
  ADMIN_USE_ADMIN_PANEL_MESSAGE,
  mayAccessOwnerPanel,
} from '@/lib/owner-panel-access';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/types';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

interface PasskeyLoginButtonProps {
  loginContext: 'owner' | 'client';
}

export default function PasskeyLoginButton({
  loginContext,
}: PasskeyLoginButtonProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryHover = alpha(primary, 0.04);
  const primaryHoverBg = alpha(primary, 0.18);
  const primaryBg = alpha(primary, 0.1);
  const primaryShadow = alpha(primary, 0.12);

  const {
    supported,
    unsupportedReason,
    isLoading,
    error,
    setError,
    loginWithPasskey,
    clearError,
  } = usePasskeyLogin(loginContext);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleClick = async (): Promise<void> => {
    clearError();
    const result = await loginWithPasskey();
    if (!result) return;

    const { token, user } = result;

    if (loginContext === 'owner') {
      if (user.role === UserRole.ADMIN) {
        clearError();
        setError(ADMIN_USE_ADMIN_PANEL_MESSAGE);
        return;
      }
      if (!mayAccessOwnerPanel(user.role)) {
        sessionStorage.removeItem('kh_owner_redirect');
        router.replace('/owner/login');
        return;
      }
    } else {
      const isClientRole = user.role === UserRole.CUSTOMER;
      if (!isClientRole) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace('/login');
        return;
      }
    }

    if (mayAccessOwnerPanel(user.role)) {
      persistOwnerToken(token);
      setRoleCookie(user.role ?? UserRole.AGENT);
    } else {
      persistClientToken(token);
      setRoleCookie(UserRole.CUSTOMER);
    }

    setUser(user);

    if (loginContext === 'owner') {
      const returnTo = sessionStorage.getItem('kh_owner_redirect');
      if (returnTo) {
        sessionStorage.removeItem('kh_owner_redirect');
        router.replace(returnTo);
      } else {
        router.replace('/owner/dashboard');
      }
    } else {
      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else {
        router.replace('/home');
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Divider sx={{ my: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          ou
        </Typography>
      </Divider>

      {!supported ? (
        <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.875rem' }}>
          {unsupportedReason ??
            'Les passkeys ne sont pas disponibles dans cet environnement.'}
        </Alert>
      ) : (
        <>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => void handleClick()}
            disabled={isLoading}
            sx={{
              borderRadius: 2.5,
              py: 1.4,
              textTransform: 'none',
              borderWidth: 2,
              borderColor: 'divider',
              color: 'text.primary',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: primary,
                borderWidth: 2,
                bgcolor: primaryHover,
                boxShadow: `0 2px 12px ${primaryShadow}`,
              },
              '&:focus-visible': {
                outline: `2px solid ${primary}`,
                outlineOffset: 2,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <CircularProgress size={22} sx={{ color: primary }} />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: primaryBg,
                    transition: 'background-color 0.2s',
                    '.MuiButton-root:hover &': {
                      bgcolor: primaryHoverBg,
                    },
                  }}
                >
                  <FingerprintIcon sx={{ fontSize: 20, color: primary }} />
                </Box>
              )}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
                  {isLoading
                    ? 'Vérification en cours…'
                    : 'Se connecter avec une Passkey'}
                </Typography>
                {!isLoading && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.68rem',
                      lineHeight: 1.2,
                    }}
                  >
                    Empreinte, Face ID ou clé de sécurité
                  </Typography>
                )}
              </Box>
            </Box>
          </Button>

          {error && (
            <Alert
              severity="error"
              onClose={clearError}
              sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.8rem' }}
            >
              {error}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
