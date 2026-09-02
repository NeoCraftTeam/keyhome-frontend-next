'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { supportService } from '@/services/support.service';
import { brand } from '@/theme/tokens';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import SendIcon from '@mui/icons-material/Send';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputBase,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

type FormStep = 'name' | 'email' | 'subject' | 'message';
const STEPS: readonly FormStep[] = [
  'name',
  'email',
  'subject',
  'message',
] as const;

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '237657507909';
const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@keyhome.app';
const CONTACT_PHONE =
  process.env.NEXT_PUBLIC_PHONE_NUMBER || '+237 693 118 109';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentStep, setCurrentStep] = useState<FormStep>('name');
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const submitMutation = useMutation({
    mutationFn: () =>
      supportService.contact({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: () => setSuccess(true),
  });
  const isSubmitting = submitMutation.isPending;
  const submitError = submitMutation.isError
    ? getSafeErrorMessage(submitMutation.error)
    : null;

  // Auto-focus the active input as the user advances through steps.
  useEffect(() => {
    if (!hasInteracted || success) return;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [currentStep, hasInteracted, success]);

  const isStepValid = useCallback(
    (step: FormStep): boolean => {
      switch (step) {
        case 'name':
          return name.trim().length > 1;
        case 'email':
          return EMAIL_RE.test(email.trim());
        case 'subject':
          return subject.trim().length >= 2;
        case 'message':
          return message.trim().length >= 10;
      }
    },
    [name, email, subject, message]
  );

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    } else {
      router.back();
    }
  }, [currentStep, router]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !isStepValid('message')) return;
    submitMutation.mutate();
  }, [isSubmitting, isStepValid, submitMutation]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Enter advances except in the message step where it produces a newline.
      if (e.key !== 'Enter' || e.shiftKey || currentStep === 'message') return;
      e.preventDefault();
      if (isStepValid(currentStep)) goNext();
    },
    [currentStep, isStepValid, goNext]
  );

  const stepIndex = STEPS.indexOf(currentStep);
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 5,
            }}
          >
            <CheckCircleOutlineIcon
              sx={{ fontSize: 36, color: 'text.primary', strokeWidth: 1.5 }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: '1.65rem', md: '1.9rem' },
              fontWeight: 800,
              letterSpacing: -0.6,
              mb: 2.5,
              color: 'text.primary',
            }}
          >
            Merci {name.trim().split(/\s+/)[0] || 'à vous'} !
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 420,
              mx: 'auto',
              lineHeight: 1.75,
              fontSize: '1rem',
              mb: 4,
            }}
          >
            Votre message a été envoyé avec succès. Nous vous répondrons dans
            les plus brefs délais à l&apos;adresse{' '}
            <Box
              component="span"
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {email}
            </Box>
            .
          </Typography>
          <Chip
            label="Temps de réponse habituel : moins de 24h"
            sx={{
              bgcolor: 'action.hover',
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.82rem',
              borderRadius: '999px',
              px: 1.5,
              py: 2.25,
              height: 'auto',
              border: 'none',
            }}
          />
        </motion.div>
      </Box>
    );
  }

  // ── Step content (single field at a time) ────────────────────────────────
  const STEP_TITLES: Record<FormStep, string> = {
    name: 'Comment puis-je vous appeler ?',
    email: name
      ? `Sur quelle adresse vous joindre, ${name.split(' ')[0]} ?`
      : 'Quelle est votre adresse e-mail ?',
    subject: "Quel est l'objet de votre message ?",
    message: 'Que pouvons-nous faire pour vous ?',
  };

  const STEP_PLACEHOLDERS: Record<FormStep, string> = {
    name: 'Votre nom complet',
    email: 'vous@exemple.com',
    subject: 'Ex : Question sur les crédits',
    message: 'Décrivez-nous votre demande en quelques mots…',
  };

  const stepValid = isStepValid(currentStep);

  return (
    <MotionConfig reducedMotion="user">
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: { xs: 4, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Chip
              label="Nous sommes à votre écoute"
              sx={{
                mb: 3,
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                bgcolor: brand.primaryAlpha10,
                color: 'primary.main',
                fontWeight: 600,
                border: '1px solid',
                borderColor: brand.primaryAlpha30,
              }}
            />
            <Typography
              variant="h3"
              fontWeight={900}
              sx={{
                letterSpacing: -1.5,
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.1,
              }}
            >
              Parlons de votre projet
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}
            >
              Une question, un problème, une idée ? Notre équipe vous répond
              personnellement, en moins de 2h, 7j/7.
            </Typography>
          </Box>

          {/* Layout: form (left) + contact info (right) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
              gap: { xs: 3, md: 5 },
              alignItems: 'start',
            }}
          >
            {/* ─── Form card (glass) ─── */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: { xs: 4, md: 6 },
                overflow: 'hidden',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow:
                  '0 1px 2px rgba(15,23,42,0.04), 0 12px 40px rgba(15,23,42,0.06)',
                minHeight: { xs: 460, md: 520 },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Progress bar */}
              <Box
                sx={{
                  height: 3,
                  width: '100%',
                  bgcolor: brand.primaryAlpha10,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    height: '100%',
                    background: brand.primary,
                  }}
                />
              </Box>

              {/* Back button (top-left) — except first step */}
              {stepIndex > 0 && (
                <Box sx={{ p: { xs: 2, md: 3 }, pb: 0 }}>
                  <IconButton
                    size="small"
                    onClick={goBack}
                    disabled={isSubmitting}
                    aria-label="Étape précédente"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Box>
              )}

              {/* Step content */}
              <Box
                sx={{
                  flex: 1,
                  p: { xs: 3, md: 6 },
                  pt: { xs: stepIndex > 0 ? 1 : 4, md: stepIndex > 0 ? 2 : 6 },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Step counter */}
                    <Typography
                      variant="overline"
                      sx={{
                        color: 'primary.main',
                        opacity: 0.6,
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        mb: 1.5,
                        display: 'block',
                      }}
                    >
                      Étape {stepIndex + 1} sur {STEPS.length}
                    </Typography>

                    {/* Step title */}
                    <Typography
                      sx={{
                        fontSize: { xs: '1.6rem', md: '2.25rem' },
                        fontWeight: 800,
                        letterSpacing: -0.8,
                        lineHeight: 1.15,
                        mb: { xs: 4, md: 6 },
                        color: 'text.primary',
                      }}
                    >
                      {STEP_TITLES[currentStep]}
                    </Typography>

                    {/* Single field (transparent, big, no border) */}
                    <Box sx={{ flex: 1 }}>
                      {currentStep === 'name' && (
                        <InputBase
                          inputRef={inputRef}
                          fullWidth
                          autoFocus
                          autoComplete="name"
                          placeholder={STEP_PLACEHOLDERS.name}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={() => setHasInteracted(true)}
                          onKeyDown={handleKeyDown}
                          inputProps={{
                            'aria-label': STEP_PLACEHOLDERS.name,
                            maxLength: 120,
                          }}
                          sx={fieldSx}
                        />
                      )}
                      {currentStep === 'email' && (
                        <InputBase
                          inputRef={inputRef}
                          fullWidth
                          autoFocus
                          type="email"
                          autoComplete="email"
                          placeholder={STEP_PLACEHOLDERS.email}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setHasInteracted(true)}
                          onKeyDown={handleKeyDown}
                          inputProps={{
                            'aria-label': STEP_PLACEHOLDERS.email,
                            maxLength: 255,
                            inputMode: 'email',
                          }}
                          sx={fieldSx}
                        />
                      )}
                      {currentStep === 'subject' && (
                        <InputBase
                          inputRef={inputRef}
                          fullWidth
                          autoFocus
                          placeholder={STEP_PLACEHOLDERS.subject}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          onFocus={() => setHasInteracted(true)}
                          onKeyDown={handleKeyDown}
                          inputProps={{
                            'aria-label': STEP_PLACEHOLDERS.subject,
                            maxLength: 120,
                          }}
                          sx={fieldSx}
                        />
                      )}
                      {currentStep === 'message' && (
                        <InputBase
                          inputRef={inputRef}
                          fullWidth
                          autoFocus
                          multiline
                          minRows={4}
                          maxRows={10}
                          placeholder={STEP_PLACEHOLDERS.message}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onFocus={() => setHasInteracted(true)}
                          inputProps={{
                            'aria-label': STEP_PLACEHOLDERS.message,
                            maxLength: 5000,
                          }}
                          sx={{
                            ...fieldSx,
                            alignItems: 'flex-start',
                          }}
                        />
                      )}

                      {/* Helper text under message */}
                      {currentStep === 'message' && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            opacity: 0.6,
                            display: 'block',
                            mt: 1.5,
                          }}
                        >
                          {message.trim().length} caractère
                          {message.trim().length > 1 ? 's' : ''} (10 minimum)
                        </Typography>
                      )}
                    </Box>

                    {/* Submission error */}
                    {submitError && currentStep === 'message' && (
                      <AppAlert
                        severity="error"
                        icon={<ErrorOutlineIcon />}
                        sx={{ mt: 3 }}
                        message={submitError}
                      />
                    )}

                    {/* Footer: hint + primary button */}
                    <Box
                      sx={{
                        mt: { xs: 4, md: 6 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      {!isMobile && currentStep !== 'message' ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary',
                            opacity: 0.55,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Appuyez sur Entrée pour continuer
                          </Typography>
                          <KeyboardReturnIcon sx={{ fontSize: 16 }} />
                        </Box>
                      ) : (
                        <Box />
                      )}

                      {currentStep === 'message' ? (
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleSubmit}
                          disabled={!stepValid || isSubmitting}
                          startIcon={
                            isSubmitting ? (
                              <ButtonSpinner size={18} />
                            ) : (
                              <SendIcon />
                            )
                          }
                          sx={{
                            borderRadius: 3,
                            px: { xs: 3.5, md: 5 },
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: brand.primary,
                            boxShadow: `0 8px 24px ${brand.primaryAlpha30}`,
                            '&:disabled': { opacity: 0.5, color: '#fff' },
                          }}
                        >
                          {isSubmitting
                            ? 'Envoi en cours…'
                            : 'Envoyer le message'}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="large"
                          onClick={goNext}
                          disabled={!stepValid}
                          sx={{
                            borderRadius: 3,
                            px: { xs: 3.5, md: 5 },
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: brand.primary,
                            boxShadow: `0 8px 24px ${brand.primaryAlpha30}`,
                            '&:disabled': { opacity: 0.5, color: '#fff' },
                          }}
                        >
                          Continuer
                        </Button>
                      )}
                    </Box>
                  </motion.div>
                </AnimatePresence>
              </Box>
            </Box>

            {/* ─── Contact info sidebar ─── */}
            <Stack spacing={3}>
              <Box
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: { xs: 4, md: 6 },
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow:
                    '0 1px 2px rgba(15,23,42,0.04), 0 12px 40px rgba(15,23,42,0.04)',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ letterSpacing: -0.5, mb: 3 }}
                >
                  Autres canaux
                </Typography>
                <Stack spacing={3}>
                  <ContactRow
                    icon={
                      <EmailOutlinedIcon
                        sx={{ color: 'text.secondary', fontSize: 22 }}
                      />
                    }
                    label="E-mail"
                    value={CONTACT_EMAIL}
                    href={`mailto:${CONTACT_EMAIL}`}
                  />
                  <ContactRow
                    icon={
                      <WhatsAppIcon
                        sx={{ color: 'text.secondary', fontSize: 22 }}
                      />
                    }
                    label="WhatsApp"
                    value={`+${WHATSAPP_NUMBER.replace(/^237/, '237 ')}`}
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    external
                  />
                  <ContactRow
                    icon={
                      <PhoneOutlinedIcon
                        sx={{ color: 'text.secondary', fontSize: 22 }}
                      />
                    }
                    label="Téléphone"
                    value={CONTACT_PHONE}
                    href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: { xs: 4, md: 6 },
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow:
                    '0 1px 2px rgba(15,23,42,0.04), 0 12px 40px rgba(15,23,42,0.04)',
                }}
              >
                <Stack spacing={2}>
                  <CalendarMonthIcon
                    sx={{ color: 'text.secondary', fontSize: 28 }}
                  />
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ letterSpacing: -0.5 }}
                  >
                    Réponse en moins de 2h
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    Notre équipe support est disponible 7j/7 pour vous
                    accompagner. Merci de privilégier ce formulaire pour un
                    suivi optimal de votre demande.
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>
    </MotionConfig>
  );
}

// ── Reusable styles & sub-components ─────────────────────────────────────────

const fieldSx = {
  width: '100%',
  fontSize: { xs: '1.4rem', md: '1.9rem' },
  fontWeight: 600,
  lineHeight: 1.4,
  py: 1,
  letterSpacing: -0.3,
  '& input, & textarea': {
    px: 0,
    py: 1,
    '&::placeholder': {
      opacity: 0.25,
      color: 'text.primary',
    },
  },
} as const;

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}

function ContactRow({ icon, label, value, href, external }: ContactRowProps) {
  return (
    <Box
      component="a"
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s ease',
        '&:hover .ContactRow-value': { color: 'primary.main' },
      }}
    >
      {icon}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'primary.main',
            opacity: 0.55,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            mb: 0.25,
            fontSize: '0.68rem',
          }}
        >
          {label}
        </Typography>
        <Typography
          className="ContactRow-value"
          variant="body1"
          fontWeight={600}
          sx={{ transition: 'color 0.2s ease' }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
