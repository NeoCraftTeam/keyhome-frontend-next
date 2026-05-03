'use client';

import {
  adReportsService,
  AdReportReason,
  AdReportScamReason,
  CreateAdReportPayload,
} from '@/services/ad-reports.service';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Radio,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { brand } from '@/theme/tokens';
import { useAuth } from '@/providers/AuthProvider';

type Props = {
  adId: string;
  open: boolean;
  submitting: boolean;
  serverError: string;
  onClose: () => void;
  onSubmittingChange: (loading: boolean) => void;
  onServerErrorChange: (value: string) => void;
  onSuccess: () => void;
};

type WizardStep = 'reason' | 'scam' | 'payment' | 'done';

type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  icon: ReactNode;
};

const reasonOptions: Option<AdReportReason>[] = [
  {
    value: 'inaccurate',
    label: 'Elle est inexacte ou incorrecte',
    icon: <ReportProblemOutlinedIcon fontSize="small" />,
  },
  {
    value: 'not_real_property',
    label: "Ce n'est pas un véritable logement",
    icon: <HomeWorkOutlinedIcon fontSize="small" />,
  },
  {
    value: 'scam',
    label: "C'est une arnaque",
    icon: <GppBadOutlinedIcon fontSize="small" />,
  },
  {
    value: 'shocking_content',
    label: 'Le contenu est choquant',
    icon: <WarningAmberOutlinedIcon fontSize="small" />,
  },
  {
    value: 'other',
    label: "Il s'agit d'autre chose",
    icon: <ReportProblemOutlinedIcon fontSize="small" />,
  },
];

const scamOptions: Option<AdReportScamReason>[] = [
  {
    value: 'asked_off_platform_payment',
    label: "L'hote m'a demande de payer en dehors de KeyHome",
    hint: 'Ex : especes, virement ou transfert bancaire',
    icon: <PaymentsOutlinedIcon fontSize="small" />,
  },
  {
    value: 'shared_contacts',
    label: "L'hote a partage ses coordonnees",
    hint: 'Ex : numero personnel, email personnel',
    icon: <ContactPhoneOutlinedIcon fontSize="small" />,
  },
  {
    value: 'promoting_external_services',
    label: "L'hote fait la promotion de services externes",
    hint: 'Ex : liens vers des sites externes',
    icon: <CampaignOutlinedIcon fontSize="small" />,
  },
  {
    value: 'duplicate_listing',
    label: "Il s'agit d'une annonce en double",
    hint: "Ex : copie d'une autre annonce",
    icon: <ReportProblemOutlinedIcon fontSize="small" />,
  },
  {
    value: 'misleading_listing',
    label: 'Elle est trompeuse',
    hint: 'Ex : photos non conformes ou informations mensongeres',
    icon: <WarningAmberOutlinedIcon fontSize="small" />,
  },
];

const paymentMethods = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Especes' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'moneygram', label: 'MoneyGram' },
  { value: 'western_union', label: 'Western Union' },
  { value: 'other', label: 'Autre' },
];

const panelMotion = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -24, opacity: 0 },
  transition: { duration: 0.2 },
};

export default function AdReportModal({
  adId,
  open,
  submitting,
  serverError,
  onClose,
  onSubmittingChange,
  onServerErrorChange,
  onSuccess,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('reason');
  const [reason, setReason] = useState<AdReportReason | null>(null);
  const [scamReason, setScamReason] = useState<AdReportScamReason | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    string[]
  >([]);
  const [otherDescription, setOtherDescription] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('reason');
      setReason(null);
      setScamReason(null);
      setSelectedPaymentMethods([]);
      setOtherDescription('');
      onServerErrorChange('');
    }
  }, [open, onServerErrorChange]);

  const canContinueFromReason = useMemo(() => {
    if (!reason) {
      return false;
    }

    if (reason === 'other') {
      return otherDescription.trim().length >= 10;
    }

    return true;
  }, [reason, otherDescription]);

  const goBack = () => {
    if (step === 'scam') {
      setStep('reason');
      return;
    }

    if (step === 'payment') {
      setStep('scam');
      return;
    }

    if (step === 'done') {
      onClose();
    }
  };

  const submit = async (payload: CreateAdReportPayload) => {
    onSubmittingChange(true);
    onServerErrorChange('');

    try {
      await adReportsService.create(adId, payload);
      setStep('done');
      onSuccess();
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 429) {
        onServerErrorChange(
          'Trop de tentatives. Veuillez patienter un instant puis reessayer.'
        );
        return;
      }

      const fallback = "Impossible d'envoyer votre signalement pour le moment.";
      const rawMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? fallback;
      const safePatterns = [
        'SQLSTATE',
        'An email must have a "To", "Cc", or "Bcc" header.',
      ];
      const shouldMaskMessage = safePatterns.some((pattern) =>
        rawMessage.includes(pattern)
      );
      const message = shouldMaskMessage ? fallback : rawMessage;
      onServerErrorChange(message);
    } finally {
      onSubmittingChange(false);
    }
  };

  const handlePrimaryContinue = async () => {
    if (!reason) {
      return;
    }

    if (reason === 'scam') {
      setStep('scam');
      return;
    }

    await submit({
      reason,
      description: reason === 'other' ? otherDescription.trim() : undefined,
    });
  };

  const handleScamContinue = async () => {
    if (!reason || !scamReason) {
      return;
    }

    if (scamReason === 'asked_off_platform_payment') {
      setStep('payment');
      return;
    }

    await submit({
      reason,
      scam_reason: scamReason,
    });
  };

  const handlePaymentToggle = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((value) => value !== method)
        : [...prev, method]
    );
  };

  const handlePaymentSubmit = async () => {
    if (!reason || !scamReason || selectedPaymentMethods.length === 0) {
      return;
    }

    await submit({
      reason,
      scam_reason: scamReason,
      payment_methods: selectedPaymentMethods,
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3, md: 4 },
            overflow: 'hidden',
            minHeight: { xs: '100dvh', sm: 520, md: 560 },
          },
        }}
      >
        <DialogTitle
          sx={{ pb: 0, pt: 1.5, px: { xs: 2, md: 3 }, minHeight: 48 }}
        >
          <IconButton
            aria-label="Fermer"
            onClick={onClose}
            disabled={submitting}
            sx={{
              position: 'absolute',
              left: { xs: 10, md: 12 },
              top: { xs: 10, md: 12 },
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              zIndex: 2,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2, md: 4 },
            pb: 0,
            pt: { xs: 1.25, md: 2 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AnimatePresence mode="wait">
            {step === 'reason' && (
              <motion.div key="reason" {...panelMotion}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.7rem', md: '2.1rem' }, mb: 1 }}
                >
                  Pourquoi signalez-vous cette annonce ?
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2.5 }}
                >
                  Ces informations ne seront pas communiquees au proprietaire.
                </Typography>

                <Stack divider={<Divider />}>
                  {reasonOptions.map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => setReason(option.value)}
                      sx={{
                        py: { xs: 1.6, md: 1.9 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.25,
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            color:
                              reason === option.value
                                ? brand.primary
                                : 'text.secondary',
                            lineHeight: 0,
                          }}
                        >
                          {option.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: '1.05rem', md: '1.45rem' },
                          }}
                        >
                          {option.label}
                        </Typography>
                      </Box>
                      <Radio
                        size="small"
                        checked={reason === option.value}
                        sx={{
                          color: brand.primary,
                          '&.Mui-checked': { color: brand.primary },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>

                {reason === 'other' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Décrivez le problème (minimum 10 caractères)
                    </Typography>
                    <TextField
                      value={otherDescription}
                      onChange={(event) =>
                        setOtherDescription(event.target.value)
                      }
                      placeholder="Expliquez ce qui vous semble problematique..."
                      multiline
                      minRows={4}
                      fullWidth
                      inputProps={{ maxLength: 2000 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                )}
              </motion.div>
            )}

            {step === 'scam' && (
              <motion.div key="scam" {...panelMotion}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, mb: 2 }}
                >
                  Pourquoi pensez-vous qu&apos;il s&apos;agit d&apos;une arnaque
                  ?
                </Typography>
                <Stack divider={<Divider />}>
                  {scamOptions.map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => setScamReason(option.value)}
                      sx={{
                        py: { xs: 1.6, md: 1.9 },
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1.25,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
                        <Box
                          sx={{
                            color:
                              scamReason === option.value
                                ? brand.primary
                                : 'text.secondary',
                            lineHeight: 0,
                            pt: 0.2,
                          }}
                        >
                          {option.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: '1.02rem', md: '1.28rem' },
                            }}
                          >
                            {option.label}
                          </Typography>
                          {option.hint && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {option.hint}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Radio
                        size="small"
                        checked={scamReason === option.value}
                        sx={{
                          color: brand.primary,
                          '&.Mui-checked': { color: brand.primary },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div key="payment" {...panelMotion}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, mb: 2 }}
                >
                  Comment vous a-t-on demandé de payer ?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                  {paymentMethods.map((method) => (
                    <Chip
                      key={method.value}
                      label={method.label}
                      onClick={() => handlePaymentToggle(method.value)}
                      variant={
                        selectedPaymentMethods.includes(method.value)
                          ? 'filled'
                          : 'outlined'
                      }
                      sx={{
                        borderRadius: 999,
                        px: 0.5,
                        bgcolor: selectedPaymentMethods.includes(method.value)
                          ? 'rgba(246,71,95,0.12)'
                          : undefined,
                        borderColor: selectedPaymentMethods.includes(
                          method.value
                        )
                          ? brand.primary
                          : undefined,
                        color: selectedPaymentMethods.includes(method.value)
                          ? brand.primary
                          : undefined,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div key="done" {...panelMotion}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, mb: 2 }}
                >
                  Nous avons reçu votre signalement
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                  Merci d&apos;avoir pris le temps de nous expliquer la
                  situation. Notre équipe examine les signalements sous 48h en
                  moyenne.
                </Typography>
                {user?.email &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    Un e-mail de confirmation vous a été envoyé à {user.email}.
                  </Typography>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    Retrouvez l&apos;accusé de réception dans votre centre de
                    notifications KeyHome.
                  </Typography>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Box sx={{ mt: 'auto', pt: 2.5 }}>
            {serverError && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                {serverError}
              </Alert>
            )}
            <Divider />
            <Box
              sx={{
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Button
                variant="text"
                disabled={submitting || (step === 'reason' && !reason)}
                onClick={goBack}
                sx={{ textTransform: 'none', textDecoration: 'underline' }}
              >
                {step === 'reason' ? 'Annuler' : 'Retour'}
              </Button>

              {step !== 'done' ? (
                <Button
                  variant="contained"
                  disabled={
                    submitting ||
                    (step === 'reason' && !canContinueFromReason) ||
                    (step === 'scam' && !scamReason) ||
                    (step === 'payment' && selectedPaymentMethods.length === 0)
                  }
                  onClick={
                    step === 'reason'
                      ? handlePrimaryContinue
                      : step === 'scam'
                        ? handleScamContinue
                        : handlePaymentSubmit
                  }
                  sx={{
                    minWidth: { xs: 108, md: 120 },
                    textTransform: 'none',
                    fontWeight: 700,
                    background: `linear-gradient(90deg, ${brand.primary} 0%, #D9007A 100%)`,
                    '&:hover': {
                      background:
                        'linear-gradient(90deg, #e33e56 0%, #be006b 100%)',
                    },
                  }}
                >
                  {submitting ? 'Envoi...' : 'Suivant'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    minWidth: { xs: 108, md: 120 },
                    textTransform: 'none',
                    fontWeight: 700,
                    background: '#1f2937',
                    '&:hover': { background: '#111827' },
                  }}
                >
                  OK
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );
}
