'use client';

/** OAuth icon row from `getConfiguredOAuthProviders()` (GitHub shown unless opted out via env). */
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { getConfiguredOAuthProviders } from '@/lib/auth/oauth-providers';
import { useAuth } from '@/providers/AuthProvider';
import { OAuthProvider } from '@/services/auth.service';
import { brand } from '@/theme/tokens';
import Facebook from '@mui/icons-material/Facebook';
import GitHub from '@mui/icons-material/GitHub';
import Google from '@mui/icons-material/Google';
import { Box, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

interface SocialLoginButtonsProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  showDivider?: boolean;
  providers?: OAuthProvider[];
  /** Inscription : indique au backend le rôle visé (compte Laravel après OTP + profil). */
  registrationIntent?: 'customer' | 'agent';
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
  github: {
    label: 'GitHub',
    icon: <GitHub />,
  },
};

export default function SocialLoginButtons({
  onError,
  disabled = false,
  showDivider = true,
  providers = getConfiguredOAuthProviders(),
  registrationIntent,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null
  );

  const { loginWithOAuth } = useAuth();
  const isAgentIntent = registrationIntent === 'agent';
  const accentBg = isAgentIntent ? '#0d9488' : brand.primary;
  const accentHover = isAgentIntent ? '#0f766e' : brand.primaryDark;

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (disabled || loadingProvider) return;

    setLoadingProvider(provider);
    try {
      await loginWithOAuth(
        provider,
        registrationIntent ? { registrationIntent } : undefined
      );
    } catch (err) {
      console.error(`OAuth ${provider} error:`, err);
      onError?.(
        `Erreur lors de la connexion avec ${providerConfig[provider].label}`
      );
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
                aria-label={config.label}
                onClick={() => handleOAuthLogin(provider)}
                disabled={disabled || !!loadingProvider}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: accentBg,
                  color: '#ffffff',
                  transition: 'background-color 0.35s ease',
                  '&:hover': {
                    bgcolor: accentHover,
                  },
                  '&:disabled': {
                    bgcolor: accentBg,
                    opacity: 0.6,
                  },
                }}
              >
                {isLoading ? (
                  <ButtonSpinner size={24} color="#fff" />
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
