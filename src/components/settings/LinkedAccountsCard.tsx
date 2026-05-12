'use client';

import { useClerk } from '@clerk/nextjs';
import Apple from '@mui/icons-material/Apple';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Facebook from '@mui/icons-material/Facebook';
import Google from '@mui/icons-material/Google';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type OAuthStrategy = 'oauth_google' | 'oauth_facebook' | 'oauth_apple';
type OAuthProviderName = 'google' | 'facebook' | 'apple';

interface SocialProvider {
  /** Clerk's `ExternalAccount.provider` value, e.g. `google`. */
  provider: OAuthProviderName;
  /** Clerk's strategy identifier passed to `createExternalAccount`. */
  strategy: OAuthStrategy;
  label: string;
  icon: React.ReactNode;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    provider: 'google',
    strategy: 'oauth_google',
    label: 'Google',
    icon: <Google sx={{ fontSize: 20 }} />,
  },
  {
    provider: 'facebook',
    strategy: 'oauth_facebook',
    label: 'Facebook',
    icon: <Facebook sx={{ fontSize: 20 }} />,
  },
  {
    provider: 'apple',
    strategy: 'oauth_apple',
    label: 'Apple',
    icon: <Apple sx={{ fontSize: 20 }} />,
  },
];

/**
 * Reusable "Comptes liés" card. Renders a list of OAuth providers (Google,
 * Facebook, Apple) with a Link / Unlink button per row, driven by Clerk's
 * `user.createExternalAccount()` + `externalAccount.destroy()` APIs.
 *
 * Critical bug avoided here (was the cause of "le bouton ne fait rien") —
 * `createExternalAccount` resolves with an `ExternalAccount` whose
 * `verification.externalVerificationRedirectURL` MUST be followed to
 * complete the OAuth handshake with the provider. Skipping that redirect
 * leaves the link in `unverified` state and the UI never updates.
 *
 * The component is used by both the client (`/parametres`) and the owner
 * (`/owner/parametres`) settings pages so the linking flow stays
 * consistent across surfaces.
 *
 * @param redirectPath  Path to come back to after OAuth round-trip (e.g.
 *                      `/parametres` for clients, `/owner/parametres` for
 *                      owners). Always rebuilt as an absolute URL using
 *                      `window.location.origin` because Clerk validates
 *                      against the dashboard whitelist.
 */
export default function LinkedAccountsCard({
  redirectPath,
}: {
  redirectPath: string;
}) {
  const { user: clerkUser } = useClerk();
  const [loading, setLoading] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState<string>('');

  const isLinked = (provider: OAuthProviderName): boolean =>
    clerkUser?.externalAccounts?.some((acc) => acc.provider === provider) ??
    false;

  const linkedEmail = (provider: OAuthProviderName): string | null =>
    clerkUser?.externalAccounts?.find((acc) => acc.provider === provider)
      ?.emailAddress ?? null;

  const handleConnect = async (strategy: OAuthStrategy) => {
    if (!clerkUser) {
      setError('Session indisponible. Reconnectez-vous puis réessayez.');
      return;
    }
    setLoading(strategy);
    setError('');
    try {
      const externalAccount = await clerkUser.createExternalAccount({
        strategy,
        // MUST be absolute — Clerk rejects relative paths.
        redirectUrl: `${window.location.origin}${redirectPath}`,
      });

      const redirectUrl =
        externalAccount.verification?.externalVerificationRedirectURL;

      if (redirectUrl) {
        window.location.assign(redirectUrl.toString());
        return;
      }

      // No redirect URL means the OAuth provider isn't configured in the
      // Clerk dashboard. Surface the precise reason instead of a generic
      // "try again later" copy.
      setError(
        `Provider ${strategy.replace(
          'oauth_',
          ''
        )} non configuré côté Clerk. Contactez le support.`
      );
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Échec de la liaison du compte. Réessayez plus tard.';
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (
    strategy: OAuthStrategy,
    provider: OAuthProviderName
  ) => {
    if (!clerkUser) {
      setError('Session indisponible. Reconnectez-vous puis réessayez.');
      return;
    }
    setLoading(strategy);
    setError('');
    try {
      const account = clerkUser.externalAccounts?.find(
        (acc) => acc.provider === provider
      );
      if (!account) {
        setError('Compte non lié.');
        return;
      }
      await account.destroy();
      // Refresh Clerk's local user state so the UI updates immediately
      // without a full page reload.
      await clerkUser.reload();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Impossible de délier ce compte. Réessayez plus tard.';
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 700 }}
          >
            Comptes liés
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Connectez vos comptes pour vous identifier en un clic.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{ mx: 2, mb: 1, borderRadius: 2, fontSize: '0.78rem' }}
          >
            {error}
          </Alert>
        )}

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          {SOCIAL_PROVIDERS.map((entry, idx) => {
            const linked = isLinked(entry.provider);
            const email = linkedEmail(entry.provider);
            const isLoading = loading === entry.strategy;

            return (
              <Box
                key={entry.provider}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                  borderTop: idx === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: linked
                      ? 'rgba(46,125,50,0.08)'
                      : 'rgba(0,0,0,0.04)',
                    color: linked ? 'success.main' : 'text.secondary',
                  }}
                >
                  {entry.icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {entry.label}
                    </Typography>
                    {linked && (
                      <CheckCircleIcon
                        sx={{ fontSize: 14, color: 'success.main' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {linked ? (email ?? 'Connecté') : 'Non connecté'}
                  </Typography>
                </Box>
                {linked ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={isLoading}
                    onClick={() =>
                      handleDisconnect(entry.strategy, entry.provider)
                    }
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <LinkOffIcon sx={{ fontSize: 16 }} />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: 2,
                      minWidth: 0,
                    }}
                  >
                    {isLoading ? '...' : 'Délier'}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    onClick={() => handleConnect(entry.strategy)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: 2,
                      minWidth: 70,
                      boxShadow: 'none',
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      'Lier'
                    )}
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
