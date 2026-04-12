'use client';

import { usePasskeyLogin } from '@/hooks/usePasskey';
import {
  persistOwnerToken,
  persistClientToken,
  setRoleCookie,
} from '@/lib/auth-session';
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
import { useRouter } from 'next/navigation';

interface PasskeyLoginButtonProps {
  loginContext: 'owner' | 'client';
}

const BRAND = {
  client: {
    main: '#F6475F',
    hover: 'rgba(246, 71, 95, 0.04)',
    hoverBg: 'rgba(246, 71, 95, 0.18)',
    bg: 'rgba(246, 71, 95, 0.1)',
    shadow: 'rgba(246, 71, 95, 0.12)',
  },
  owner: {
    main: '#0D9488',
    hover: 'rgba(13, 148, 136, 0.04)',
    hoverBg: 'rgba(13, 148, 136, 0.18)',
    bg: 'rgba(13, 148, 136, 0.1)',
    shadow: 'rgba(13, 148, 136, 0.12)',
  },
} as const;

export default function PasskeyLoginButton({
  loginContext,
}: PasskeyLoginButtonProps) {
  const { supported, isLoading, error, loginWithPasskey, clearError } =
    usePasskeyLogin(loginContext);
  const { setUser } = useAuth();
  const router = useRouter();
  const c = BRAND[loginContext];

  if (!supported) return null;

  const handleClick = async () => {
    clearError();
    const result = await loginWithPasskey();
    if (!result) return;

    const { token, user } = result;

    // Defensive: ensure the authenticated role matches the panel context.
    // This avoids confusing redirects (e.g. owner passkey login ending up on /home)
    // if the backend session resolves to an unexpected role.
    if (loginContext === 'owner') {
      const isOwnerRole =
        user.role === UserRole.AGENT || user.role === UserRole.ADMIN;
      if (!isOwnerRole) {
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

    // Persist like the existing login flow
    if (user.role === UserRole.AGENT || user.role === UserRole.ADMIN) {
      persistOwnerToken(token);
      setRoleCookie(user.role ?? UserRole.AGENT);
    } else {
      persistClientToken(token);
      setRoleCookie(UserRole.CUSTOMER);
    }

    setUser(user);

    // Navigate
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

      <Button
        fullWidth
        variant="outlined"
        onClick={handleClick}
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
            borderColor: c.main,
            borderWidth: 2,
            bgcolor: c.hover,
            boxShadow: `0 2px 12px ${c.shadow}`,
          },
          '&:focus-visible': {
            outline: `2px solid ${c.main}`,
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
            <CircularProgress size={22} sx={{ color: c.main }} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: c.bg,
                transition: 'background-color 0.2s',
                '.MuiButton-root:hover &': {
                  bgcolor: c.hoverBg,
                },
              }}
            >
              <FingerprintIcon sx={{ fontSize: 20, color: c.main }} />
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
    </Box>
  );
}
