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
  { label: string; icon: React.ReactNode; bgColor: string; hoverColor: string; iconColor: string }
> = {
  google: {
    label: 'Google',
    icon: <Google />,
    bgColor: '#ffffff',
    hoverColor: '#f5f5f5',
    iconColor: '#DB4437',
  },
  facebook: {
    label: 'Facebook',
    icon: <Facebook />,
    bgColor: '#1877F2',
    hoverColor: '#166FE5',
    iconColor: '#ffffff',
  },
  apple: {
    label: 'Apple',
    icon: <Apple />,
    bgColor: '#000000',
    hoverColor: '#333333',
    iconColor: '#ffffff',
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
                  bgcolor: config.bgColor,
                  color: config.iconColor,
                  border: provider === 'google' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: config.hoverColor,
                  },
                  '&:disabled': {
                    bgcolor: config.bgColor,
                    opacity: 0.6,
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: config.iconColor }} />
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
