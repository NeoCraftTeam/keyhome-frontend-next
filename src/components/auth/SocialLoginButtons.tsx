'use client';

import { authService, OAuthProvider } from '@/services/auth.service';
import { Apple, Facebook, Google } from '@mui/icons-material';
import { Box, Button, CircularProgress, Divider, Typography } from '@mui/material';
import { useState } from 'react';

interface SocialLoginButtonsProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  showDivider?: boolean;
  providers?: OAuthProvider[];
}

const providerConfig: Record<
  OAuthProvider,
  { label: string; icon: React.ReactNode; color: string; hoverColor: string }
> = {
  google: {
    label: 'Google',
    icon: <Google />,
    color: '#ffffff',
    hoverColor: '#f5f5f5',
  },
  facebook: {
    label: 'Facebook',
    icon: <Facebook />,
    color: '#1877F2',
    hoverColor: '#166FE5',
  },
  apple: {
    label: 'Apple',
    icon: <Apple />,
    color: '#000000',
    hoverColor: '#333333',
  },
};

export default function SocialLoginButtons({
  onError,
  disabled = false,
  showDivider = true,
  providers = ['google', 'facebook', 'apple'],
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (disabled || loadingProvider) return;

    setLoadingProvider(provider);
    try {
      const redirectUrl = await authService.getOAuthRedirectUrl(provider);
      // Store provider in sessionStorage for callback
      sessionStorage.setItem('oauth_provider', provider);
      // Redirect to OAuth provider
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(`OAuth ${provider} error:`, err);
      onError?.(`Erreur lors de la connexion avec ${providerConfig[provider].label}`);
      setLoadingProvider(null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {showDivider && (
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            ou continuer avec
          </Typography>
        </Divider>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {providers.map((provider) => {
          const config = providerConfig[provider];
          const isLoading = loadingProvider === provider;
          const isGoogle = provider === 'google';

          return (
            <Button
              key={provider}
              fullWidth
              variant={isGoogle ? 'outlined' : 'contained'}
              onClick={() => handleOAuthLogin(provider)}
              disabled={disabled || !!loadingProvider}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  config.icon
                )
              }
              sx={{
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.9375rem',
                fontWeight: 500,
                ...(isGoogle
                  ? {
                      borderColor: 'divider',
                      color: 'text.primary',
                      bgcolor: config.color,
                      '&:hover': {
                        bgcolor: config.hoverColor,
                        borderColor: 'divider',
                      },
                    }
                  : {
                      bgcolor: config.color,
                      color: '#fff',
                      '&:hover': {
                        bgcolor: config.hoverColor,
                      },
                    }),
              }}
            >
              Continuer avec {config.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
