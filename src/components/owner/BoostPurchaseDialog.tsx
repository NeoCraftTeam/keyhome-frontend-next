'use client';

import PaymentFlow from '@/components/payment/PaymentFlow';
import { formatPrice } from '@/lib/constants';
import {
  ownerAdsService,
  type BoostPlan,
} from '@/services/owner/owner-ads.service';
import { brandAgent } from '@/theme/tokens';
import { PaymentType } from '@/types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface BoostPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  adId: string;
  adTitle: string;
  onSuccess: () => void;
}

const BOOST_BENEFITS = [
  'Position prioritaire dans les résultats',
  'Badge "Annonce Boostée" visible',
  'Remontée quotidienne automatique',
  'Statistiques de visibilité détaillées',
];

export default function BoostPurchaseDialog({
  open,
  onClose,
  adId,
  adTitle,
  onSuccess,
}: BoostPurchaseDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const {
    data: plans = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['boost-plans'],
    queryFn: () => ownerAdsService.getBoostPlans(),
    staleTime: 60 * 60 * 1000,
    enabled: open,
  });

  const handleSelectPlan = (plan: BoostPlan) => {
    setSelectedPlan(plan);
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    setSelectedPlan(null);
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (paymentOpen) return;
    setSelectedPlan(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          pr: 6,
        }}
      >
        <RocketLaunchIcon sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Booster cette annonce
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {adTitle}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={paymentOpen}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Fermer"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {paymentOpen && selectedPlan ? (
          <Box sx={{ py: 1 }}>
            <Button
              size="small"
              onClick={() => setPaymentOpen(false)}
              sx={{ mb: 2, fontWeight: 600 }}
            >
              ← Changer de plan
            </Button>
            <PaymentFlow
              amount={selectedPlan.price}
              type={PaymentType.BOOST}
              adId={adId}
              planId={selectedPlan.id}
              onSuccess={handlePaymentSuccess}
              onBack={() => setPaymentOpen(false)}
            />
          </Box>
        ) : (
          <>
            {/* Benefits strip */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(brandAgent.primary, 0.05),
                border: '1px solid',
                borderColor: alpha(brandAgent.primary, 0.15),
              }}
            >
              {BOOST_BENEFITS.map((b) => (
                <Box
                  key={b}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <CheckCircleIcon
                    sx={{ fontSize: 14, color: 'primary.main' }}
                  />
                  <Typography variant="caption" fontWeight={600}>
                    {b}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Plans */}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : isError ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Impossible de charger les plans de boost. Réessayez.
              </Alert>
            ) : plans.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Aucun plan de boost disponible pour le moment.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {plans.map((plan) => (
                  <Box
                    key={plan.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 2.5,
                      borderRadius: 2.5,
                      border: '2px solid',
                      borderColor: alpha(brandAgent.primary, 0.2),
                      bgcolor: alpha(brandAgent.primary, 0.02),
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(brandAgent.primary, 0.05),
                      },
                    }}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body1" fontWeight={700}>
                          {plan.name}
                        </Typography>
                        <Chip
                          label={`${plan.boost_duration_days} jours`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {plan.description && (
                        <Typography variant="caption" color="text.secondary">
                          {plan.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color="primary.main"
                      >
                        {formatPrice(plan.price)}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          mt: 0.5,
                          borderRadius: 2,
                          fontWeight: 700,
                          px: 2,
                          pointerEvents: 'none',
                        }}
                        tabIndex={-1}
                      >
                        Choisir
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
