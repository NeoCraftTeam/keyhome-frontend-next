'use client';

import { authService, OAuthProvider } from '@/services/auth.service';
import { Apple, Facebook, Google } from '@mui/icons-material';
import { Box, CircularProgress, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

interface SocialLoginButtonsProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  showDivider?: boolean;
  providers?: OAuthProvider[];
}

const providerConfig: Record<
  OAuthProvider,
  { label: string; icon: React.ReactNode }
> = {
  google: {
    label: 'Google',
    icon: <Google />,
  },
  facebook: {
    label: 'Facebook',
    icon: <Facebook />,
  },
  apple: {
    label: 'Apple',
    icon: <Apple />,
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
      sessionStorage.setItem('oauth_provider', provider);
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

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {providers.map((provider) => {
          const config = providerConfig[provider];
          const isLoading = loadingProvider === provider;

          return (
            <Tooltip key={provider} title={config.label} arrow>
              <IconButton
                onClick={() => handleOAuthLogin(provider)}
                disabled={disabled || !!loadingProvider}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: '#F6475F',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#D93A50',
                  },
                  '&:disabled': {
                    bgcolor: '#F6475F',
                    opacity: 0.6,
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : (
                  config.icon
                )}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
