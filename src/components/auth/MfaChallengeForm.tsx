'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import FadeIn from '@/components/ui/layout/FadeIn';
import {
  consumeMfaChallenge,
  forgetMfaChallenge,
  isTerminalMfaError,
  MFA_CHALLENGE_LOST_MESSAGE,
  mfaAttemptsRemaining,
  mfaErrorMessage,
  mfaLoginPathFor,
  mfaRetryAfterSeconds,
  peekMfaChallenge,
  updateMfaChallengeAttempts,
  type MfaLoginContext,
  type MfaMethod,
  type PendingMfaChallenge,
} from '@/lib/auth/mfa-challenge';
import {
  OWNER_LOGIN_HERO_SRC,
  OWNER_LOGO_SRC,
} from '@/lib/owner/owner-auth-assets';
import { runAppRouterReplacement } from '@/lib/safe-app-router-push';
import { useAuth } from '@/providers/AuthProvider';
import { mfaService } from '@/services/mfa.service';
import { brand, brandAgent, neutral } from '@/theme/tokens';
import ArrowBack from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShieldIcon from '@mui/icons-material/Shield';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Matches the API's own 60 s cooldown between two emailed codes. */
const RESEND_COOLDOWN_SECONDS = 60;

const METHOD_ORDER: MfaMethod[] = ['totp', 'email', 'recovery'];

/** Copy for the "use another method" buttons. */
const SWITCH_LABELS: Record<MfaMethod, string> = {
  totp: "Utiliser l'application d'authentification",
  email: 'Recevoir un code par email',
  recovery: 'Utiliser un code de secours',
};

const METHOD_ICONS: Record<MfaMethod, React.ReactNode> = {
  totp: <ShieldIcon sx={{ fontSize: 18 }} />,
  email: <EmailIcon sx={{ fontSize: 18 }} />,
  recovery: <VpnKeyIcon sx={{ fontSize: 18 }} />,
};

/**
 * Keep the field in the exact shape the API expects: 6 digits for a TOTP or an
 * emailed code, `XXXXX-XXXXX` for a recovery code (the dash is re-inserted so a
 * user typing or pasting without it still submits a valid code).
 */
function normalizeMfaInput(value: string, isRecovery: boolean): string {
  if (!isRecovery) {
    return value.replace(/\D/g, '').slice(0, 6);
  }

  const raw = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);

  return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}

/**
 * Second factor at login — consumes the in-memory ticket minted by the login
 * surfaces and exchanges a code for the real Sanctum token.
 *
 * The ticket never touches `sessionStorage`, so a page reload legitimately
 * loses it: that case renders the "reconnectez-vous" panel rather than a broken
 * form. Backend messages are never echoed — every failure goes through
 * {@link mfaErrorMessage}.
 */
export default function MfaChallengeForm({
  context,
}: {
  context: MfaLoginContext;
}) {
  const { finalizeAuth } = useAuth();
  const router = useRouter();

  const isOwner = context === 'owner';
  const accent = isOwner ? brandAgent.primary : brand.primary;
  const accentHover = isOwner ? brandAgent.primaryDark : brand.primaryHover;
  const loginPath = mfaLoginPathFor(context);

  const [challenge, setChallenge] = useState<PendingMfaChallenge | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [method, setMethod] = useState<MfaMethod>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [lostMessage, setLostMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const emailCodeSentRef = useRef(false);

  useEffect(() => {
    const pending = peekMfaChallenge();
    setIsBootstrapped(true);

    if (!pending) {
      setLostMessage(MFA_CHALLENGE_LOST_MESSAGE);

      return;
    }

    setChallenge(pending);
    setMethod(
      pending.methods.includes('totp') ? 'totp' : (pending.methods[0] ?? 'totp')
    );
  }, []);

  const sendEmailCode = useCallback(async (mfaToken: string) => {
    setError('');

    try {
      const data = await mfaService.sendChallengeEmailCode(mfaToken);
      emailCodeSentRef.current = true;
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfo(
        `Un code a été envoyé à ${data.masked_email ?? 'votre adresse email'}.`
      );
    } catch (err) {
      // 429 still means a code is waiting in the inbox — surface the wait, not a failure.
      const wait = mfaRetryAfterSeconds(err);

      if (wait !== null) {
        emailCodeSentRef.current = true;
        setResendCooldown(wait);
        setInfo('Un code vous a déjà été envoyé. Vérifiez votre boîte mail.');

        return;
      }

      setError(
        mfaErrorMessage(
          err,
          "Impossible d'envoyer le code. Réessayez dans un instant."
        )
      );
    }
  }, []);

  // An email-only account has nothing to type until a code has been mailed.
  useEffect(() => {
    if (!challenge || method !== 'email' || emailCodeSentRef.current) {
      return;
    }

    void sendEmailCode(challenge.mfaToken);
  }, [challenge, method, sendEmailCode]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(
      () => setResendCooldown((previous) => Math.max(0, previous - 1)),
      1000
    );

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isRecovery = method === 'recovery';
  const submittedCode = isRecovery ? code.trim().toUpperCase() : code;
  const isComplete = isRecovery
    ? submittedCode.length >= 8
    : submittedCode.length === 6;

  const switchMethod = (next: MfaMethod) => {
    setMethod(next);
    setCode('');
    setError('');
    setInfo('');
    codeInputRef.current?.focus();
  };

  /** Abandoning the challenge must also drop the pre-auth ticket. */
  const leaveChallenge = () => {
    forgetMfaChallenge();
    runAppRouterReplacement(router, loginPath);
  };

  const alternatives = challenge
    ? METHOD_ORDER.filter((candidate) => {
        if (candidate === method) return false;

        return candidate === 'recovery'
          ? challenge.hasRecoveryCodes
          : challenge.methods.includes(candidate);
      })
    : [];

  const handleSubmit = async () => {
    if (!challenge || !isComplete || isSubmitting) {
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      const result = await mfaService.completeChallenge(
        challenge.mfaToken,
        submittedCode,
        method
      );

      consumeMfaChallenge();

      const expiresAtMs = result.expires_at
        ? new Date(result.expires_at).getTime()
        : undefined;

      // `finalizeAuth` derives the panel slot from the role, so an owner who
      // completed a client-side challenge still lands in the right context.
      finalizeAuth(
        result.access_token,
        result.user,
        result.panel_sso_url,
        expiresAtMs
      );
    } catch (err) {
      const attempts = mfaAttemptsRemaining(err);

      if (attempts !== null) {
        updateMfaChallengeAttempts(attempts);
        setChallenge((previous) =>
          previous ? { ...previous, attemptsRemaining: attempts } : previous
        );
      }

      // Exhausted / unknown ticket, or a panel the account may not enter:
      // retrying cannot help, the login has to start over.
      if (isTerminalMfaError(err)) {
        forgetMfaChallenge();
        setChallenge(null);
        setLostMessage(mfaErrorMessage(err, MFA_CHALLENGE_LOST_MESSAGE));

        return;
      }

      setError(
        mfaErrorMessage(err, 'Code incorrect. Vérifiez le code puis réessayez.')
      );
      setCode('');
      codeInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: '100dvh' }}>
      {/* Visuel — masqué sur mobile pour laisser toute la place au code. */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Image
          src={isOwner ? OWNER_LOGIN_HERO_SRC : '/images/02OTP.webp'}
          alt="Vérification en deux étapes KeyHome"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: isOwner
              ? `linear-gradient(to bottom, ${brandAgent.primaryAlpha20} 0%, ${brandAgent.primaryAlpha25} 100%)`
              : 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 6,
            zIndex: 2,
          }}
        >
          <FadeIn delay={0.2} direction="up">
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}
            >
              <Image
                src={isOwner ? OWNER_LOGO_SRC : '/images/logo.png'}
                alt="KeyHome"
                width={42}
                height={42}
              />
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: neutral.white }}
              >
                KeyHome
              </Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography
              variant="h5"
              fontWeight={400}
              sx={{ maxWidth: 360, color: alpha(neutral.white, 0.9) }}
            >
              Deux étapes, un compte protégé
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.paper',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
          <IconButton
            onClick={leaveChallenge}
            size="medium"
            aria-label="Retour à la connexion"
            sx={{
              bgcolor: 'rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
              borderRadius: 2,
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <FadeIn direction="none">
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Image
              src={isOwner ? OWNER_LOGO_SRC : '/images/logo.png'}
              alt="KeyHome"
              width={40}
              height={40}
              priority
            />
            <Typography variant="h5" fontWeight={700} sx={{ color: accent }}>
              KeyHome
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {!isBootstrapped ? null : !challenge ? (
            <FadeIn direction="up">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Vérification interrompue
              </Typography>
              <AppAlert
                severity="warning"
                id="mfa-challenge-lost"
                message={lostMessage || MFA_CHALLENGE_LOST_MESSAGE}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={leaveChallenge}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: '14px',
                  textTransform: 'none',
                  background: accent,
                  '&:hover': { background: accentHover },
                }}
              >
                Retour à la connexion
              </Button>
            </FadeIn>
          ) : (
            <>
              <FadeIn delay={0.1} direction="up">
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Vérification en deux étapes
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {method === 'totp' &&
                    "Saisissez le code à 6 chiffres affiché dans votre application d'authentification."}
                  {method === 'email' && (
                    <>
                      Saisissez le code à 6 chiffres envoyé à{' '}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {challenge.maskedEmail || 'votre adresse email'}
                      </Typography>
                      .
                    </>
                  )}
                  {method === 'recovery' &&
                    "Saisissez l'un de vos codes de secours. Il sera consommé définitivement."}
                </Typography>
              </FadeIn>

              <FadeIn delay={0.2} direction="up">
                {error ? (
                  <AppAlert
                    severity="error"
                    id="mfa-challenge-error"
                    message={error}
                    sx={{ mb: 2 }}
                  />
                ) : null}

                {info && !error ? (
                  <AppAlert
                    severity="info"
                    id="mfa-challenge-info"
                    message={info}
                    sx={{ mb: 2 }}
                  />
                ) : null}

                <TextField
                  inputRef={codeInputRef}
                  fullWidth
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    setCode(normalizeMfaInput(event.target.value, isRecovery))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  label={isRecovery ? 'Code de secours' : 'Code à 6 chiffres'}
                  placeholder={isRecovery ? 'ABCDE-FGHIJ' : '000000'}
                  autoComplete="one-time-code"
                  disabled={isSubmitting}
                  aria-describedby="mfa-attempts-hint"
                  slotProps={{
                    htmlInput: {
                      inputMode: isRecovery ? 'text' : 'numeric',
                      maxLength: isRecovery ? 11 : 6,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        letterSpacing: isRecovery ? '0.16em' : '0.4em',
                      },
                    },
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': { borderRadius: '14px' },
                  }}
                />

                <Typography
                  id="mfa-attempts-hint"
                  variant="caption"
                  sx={{ display: 'block', mb: 2.5, color: 'text.secondary' }}
                >
                  {challenge.attemptsRemaining > 0
                    ? `Il vous reste ${challenge.attemptsRemaining} tentative${
                        challenge.attemptsRemaining > 1 ? 's' : ''
                      } avant de devoir vous reconnecter.`
                    : 'Plus aucune tentative : reconnectez-vous pour recommencer.'}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => void handleSubmit()}
                  disabled={!isComplete || isSubmitting}
                  startIcon={isSubmitting ? <ButtonSpinner size={18} /> : null}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: '14px',
                    textTransform: 'none',
                    background: accent,
                    '&:hover': { background: accentHover },
                  }}
                >
                  {isSubmitting ? 'Vérification…' : 'Vérifier et se connecter'}
                </Button>

                {method === 'email' ? (
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={() => void sendEmailCode(challenge.mfaToken)}
                    sx={{
                      mt: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: accent,
                    }}
                  >
                    {resendCooldown > 0
                      ? `Renvoyer un code (${resendCooldown} s)`
                      : 'Renvoyer un code'}
                  </Button>
                ) : null}

                {alternatives.length > 0 ? (
                  <>
                    <Divider sx={{ my: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Autre méthode
                      </Typography>
                    </Divider>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      {alternatives.map((candidate) => (
                        <Button
                          key={candidate}
                          fullWidth
                          variant="outlined"
                          startIcon={METHOD_ICONS[candidate]}
                          onClick={() => switchMethod(candidate)}
                          disabled={isSubmitting}
                          sx={{
                            py: 1.25,
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontWeight: 600,
                            justifyContent: 'flex-start',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: accent,
                              bgcolor: alpha(accent, 0.04),
                            },
                          }}
                        >
                          {SWITCH_LABELS[candidate]}
                        </Button>
                      ))}
                    </Box>
                  </>
                ) : null}

                <Button
                  fullWidth
                  variant="text"
                  onClick={leaveChallenge}
                  sx={{
                    mt: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    color: 'text.secondary',
                  }}
                >
                  Revenir à la connexion
                </Button>
              </FadeIn>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
