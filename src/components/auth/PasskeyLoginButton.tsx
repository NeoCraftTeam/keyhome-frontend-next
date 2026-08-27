'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { usePasskeyLogin } from '@/hooks/usePasskey';
import { AUTH_PANEL_UNAVAILABLE_MESSAGE } from '@/lib/auth/auth-api-errors';
import {
  persistClientToken,
  persistOwnerToken,
  setRoleCookie,
} from '@/lib/auth/auth-session';
import { clearReturnTo, consumeReturnTo } from '@/lib/auth/return-to';
import { mayAccessOwnerPanel } from '@/lib/owner/owner-panel-access';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/types';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { Box, Button, Divider, Typography } from '@mui/material';
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
        setError(AUTH_PANEL_UNAVAILABLE_MESSAGE);
        return;
      }
      if (!mayAccessOwnerPanel(user.role)) {
        clearReturnTo('owner');
        router.replace('/owner/login');
        return;
      }
    } else {
      const isClientRole = user.role === UserRole.CUSTOMER;
      if (!isClientRole) {
        clearReturnTo('client');
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

    router.replace(
      consumeReturnTo(loginContext === 'owner' ? 'owner' : 'client')
    );
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
        <AppAlert
          severity="info"
          message={
            unsupportedReason ??
            'Les passkeys ne sont pas disponibles dans cet environnement.'
          }
          sx={{ fontSize: '0.875rem' }}
        />
      ) : (
        <>
          <Button
            fullWidth
            variant="text"
            disableRipple
            onClick={() => void handleClick()}
            disabled={isLoading}
            sx={{
              borderRadius: 2.5,
              py: 1.4,
              textTransform: 'none',
              border: 'none',
              color: 'text.primary',
              bgcolor: primaryBg,
              transition: 'all 0.2s',
              '&:hover': {
                border: 'none',
                bgcolor: primaryHoverBg,
                boxShadow: `0 2px 12px ${primaryShadow}`,
              },
              // Keep a keyboard focus ring for accessibility (only shows on
              // keyboard navigation, never on pointer clicks).
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
                <ButtonSpinner size={22} color={primary} />
              ) : (
                <FingerprintIcon sx={{ fontSize: 26, color: primary }} />
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
            <AppAlert
              severity="error"
              onClose={clearError}
              message={error}
              sx={{ mt: 1.5, fontSize: '0.8rem' }}
            />
          )}
        </>
      )}
    </Box>
  );
}
