'use client';

import { useClerk } from '@clerk/nextjs';
import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { getSafeErrorMessage } from '@/lib/error-messages';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Facebook from '@mui/icons-material/Facebook';
import GitHub from '@mui/icons-material/GitHub';
import Google from '@mui/icons-material/Google';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type OAuthStrategy = 'oauth_google' | 'oauth_facebook' | 'oauth_github';
type OAuthProviderName = 'google' | 'facebook' | 'github';

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
    provider: 'github',
    strategy: 'oauth_github',
    label: 'GitHub',
    icon: <GitHub sx={{ fontSize: 20 }} />,
  },
];

/**
 * Card "Comptes liés" — lie / délie des comptes OAuth (Google, Facebook, GitHub)
 * à un compte KeyHome existant via l'API Clerk.
 *
 * ## Flux de liaison
 * 1. `handleConnect` appelle `user.createExternalAccount({ redirectUrl: /link-account-callback })`.
 * 2. Clerk retourne un `externalVerificationRedirectURL` → on suit ce redirect vers le provider OAuth.
 * 3. Après le consentement OAuth, Clerk redirige vers `/link-account-callback`.
 * 4. Cette page appelle `user.reload()` et renvoie l'utilisateur ici.
 * 5. La carte se rafraîchit automatiquement car `clerkUser` est réactif.
 *
 * ## Flux de déliage
 * 1. `handleDisconnect` appelle `externalAccount.destroy()`.
 * 2. `clerkUser.reload()` rafraîchit l'état local sans rechargement de page.
 * 3. Une garde vérifie qu'il reste au moins un moyen d'authentification (email ou autre provider).
 *
 * @param redirectPath  Chemin de retour après le round-trip OAuth
 *                      (`/parametres` pour les clients, `/owner/parametres` pour les owners).
 */
export default function LinkedAccountsCard({
  redirectPath,
}: {
  redirectPath: string;
}) {
  const { user: clerkUser } = useClerk();

  /** Strategy en cours de traitement (liaison ou déliage). */
  const [loading, setLoading] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  /** Vérifie si un provider est déjà lié au compte Clerk. */
  const isLinked = (provider: OAuthProviderName): boolean =>
    clerkUser?.externalAccounts?.some(
      (acc) =>
        acc.provider === provider && acc.verification?.status === 'verified'
    ) ?? false;

  /** Retourne l'email associé à un provider lié, ou null. */
  const linkedEmail = (provider: OAuthProviderName): string | null =>
    clerkUser?.externalAccounts?.find(
      (acc) =>
        acc.provider === provider && acc.verification?.status === 'verified'
    )?.emailAddress ?? null;

  /**
   * Vérifie qu'il reste au moins une méthode d'authentification après déliage.
   * Clerk refuse `destroy()` sur le dernier moyen d'auth — on l'anticipe pour
   * afficher un message clair avant même l'appel API.
   */
  const hasOtherAuthMethod = (excludeProvider: OAuthProviderName): boolean => {
    // L'utilisateur a un mot de passe → toujours ok
    if (clerkUser?.passwordEnabled) return true;
    // Il reste d'autres providers liés
    const otherLinked = clerkUser?.externalAccounts?.filter(
      (acc) =>
        acc.provider !== excludeProvider &&
        acc.verification?.status === 'verified'
    );
    return (otherLinked?.length ?? 0) > 0;
  };

  /** Lance le flux OAuth de liaison via Clerk. */
  const handleConnect = async (strategy: OAuthStrategy) => {
    if (!clerkUser) {
      setError('Session indisponible. Reconnectez-vous puis réessayez.');
      return;
    }

    setLoading(strategy);
    setError('');
    setSuccessMessage('');

    try {
      // Mémorise le chemin de retour pour `/link-account-callback`.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('kh_link_return_path', redirectPath);
      }

      const externalAccount = await clerkUser.createExternalAccount({
        strategy,
        // URL dédiée au callback — la page settings n'est pas équipée pour
        // consommer les params Clerk (__clerk_ticket, __clerk_status).
        redirectUrl: `${window.location.origin}/link-account-callback`,
      });

      const oauthRedirectUrl =
        externalAccount.verification?.externalVerificationRedirectURL;

      if (oauthRedirectUrl) {
        // Déclenche la redirection OAuth. Le spinner reste affiché pendant le
        // round-trip — `setLoading(null)` n'est pas appelé ici intentionnellement
        // car la page sera démontée avant le retour.
        window.location.assign(oauthRedirectUrl.toString());
        return;
      }

      // Pas de redirect URL = provider non configuré dans le dashboard Clerk.
      setError(
        `Le provider ${strategy.replace('oauth_', '')} n'est pas configuré. Contactez le support.`
      );
    } catch (err) {
      // Clerk lance une `ClerkAPIResponseError` avec des codes spécifiques.
      let message = 'Échec de la liaison du compte. Réessayez plus tard.';

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (
          msg.includes('already') ||
          msg.includes('exists') ||
          msg.includes('taken')
        ) {
          message =
            'Ce compte social est déjà associé à un autre utilisateur KeyHome.';
        } else if (
          msg.includes('not allowed') ||
          msg.includes('unauthorized')
        ) {
          message =
            "Cette action n'est pas autorisée. Vérifiez vos paramètres.";
        } else if (msg.includes('verification') || msg.includes('unverified')) {
          message =
            'La vérification OAuth a échoué. Réessayez depuis le début.';
        } else {
          message = getSafeErrorMessage(err, message);
        }
      }

      setError(message);
    } finally {
      // Remet à null seulement si on n'a PAS déclenché de redirect
      // (si redirect en cours, la page est démontée de toute façon).
      setLoading((prev) => (prev === strategy ? null : prev));
    }
  };

  /** Délie un provider OAuth du compte Clerk. */
  const handleDisconnect = async (
    strategy: OAuthStrategy,
    provider: OAuthProviderName
  ) => {
    if (!clerkUser) {
      setError('Session indisponible. Reconnectez-vous puis réessayez.');
      return;
    }

    // Vérifie qu'il reste un autre moyen d'authentification avant d'appeler Clerk.
    if (!hasOtherAuthMethod(provider)) {
      setError(
        `Impossible de délier ${SOCIAL_PROVIDERS.find((p) => p.provider === provider)?.label ?? provider} : ` +
          "c'est votre seul moyen de connexion. Ajoutez un mot de passe ou liez un autre compte d'abord."
      );
      return;
    }

    setLoading(strategy);
    setError('');
    setSuccessMessage('');

    try {
      const account = clerkUser.externalAccounts?.find(
        (acc) => acc.provider === provider
      );

      if (!account) {
        setError('Compte introuvable. Rafraîchissez la page et réessayez.');
        return;
      }

      await account.destroy();

      // Rafraîchit l'objet Clerk en mémoire pour que la carte se mette à jour
      // immédiatement sans rechargement de page.
      await clerkUser.reload();

      const label =
        SOCIAL_PROVIDERS.find((p) => p.provider === provider)?.label ??
        provider;
      setSuccessMessage(`${label} délié avec succès.`);
    } catch (err) {
      let message = 'Impossible de délier ce compte. Réessayez plus tard.';

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (
          msg.includes('last') ||
          msg.includes('only') ||
          msg.includes('seul')
        ) {
          message =
            "Impossible de délier : c'est votre dernier moyen de connexion.";
        } else {
          message = getSafeErrorMessage(err, message);
        }
      }

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
        {/* ── En-tête ── */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 700 }}
          >
            Comptes liés
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Connectez vos comptes sociaux pour vous identifier en un clic.
          </Typography>
        </Box>

        {/* ── Messages de feedback ── */}
        {error && (
          <AppAlert
            severity="error"
            onClose={() => setError('')}
            sx={{ mx: 2, mb: 1 }}
            message={error}
          />
        )}
        {successMessage && (
          <AppAlert
            severity="success"
            onClose={() => setSuccessMessage('')}
            sx={{ mx: 2, mb: 1 }}
            message={successMessage}
          />
        )}

        <Divider />

        {/* ── Liste des providers ── */}
        <Box sx={{ px: 2, py: 1 }}>
          {SOCIAL_PROVIDERS.map((entry, idx) => {
            const linked = isLinked(entry.provider);
            const email = linkedEmail(entry.provider);
            const isProcessing = loading === entry.strategy;
            const canUnlink = linked && hasOtherAuthMethod(entry.provider);

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
                {/* Icône du provider */}
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

                {/* Nom + état */}
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

                {/* Bouton Lier / Délier */}
                {linked ? (
                  <Tooltip
                    title={
                      !canUnlink
                        ? "Seul moyen de connexion — ajoutez un autre compte ou un mot de passe d'abord"
                        : ''
                    }
                    arrow
                    disableHoverListener={canUnlink}
                  >
                    <span>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={isProcessing || !canUnlink}
                        onClick={() =>
                          handleDisconnect(entry.strategy, entry.provider)
                        }
                        startIcon={
                          isProcessing ? (
                            <ButtonSpinner size={14} />
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
                        {isProcessing ? '…' : 'Délier'}
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isProcessing || !!loading}
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
                    {isProcessing ? <ButtonSpinner size={14} /> : 'Lier'}
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
