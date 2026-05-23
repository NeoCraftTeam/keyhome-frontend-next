'use client';

import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { Ad } from '@/types';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import Bolt from '@mui/icons-material/Bolt';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Description from '@mui/icons-material/Description';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import Star from '@mui/icons-material/Star';
import WaterDrop from '@mui/icons-material/WaterDrop';
import { Box, Button, Typography } from '@mui/material';

const ICON_SLOT_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  minWidth: 22,
  flexShrink: 0,
} as const;

interface Props {
  ad: Ad;
  isLocked: boolean;
  mb?: number;
}

export default function SupplementaryInfoCard({ ad, isLocked, mb = 2 }: Props) {
  const hasSupplementaryInfo = !!(
    ad.deposit_amount ||
    ad.minimum_lease_duration ||
    ad.detailed_charges ||
    ad.property_condition_pdf ||
    ad.charges_eau ||
    ad.charges_electricite ||
    ad.charges_autres ||
    ad.charges_forfaitaires ||
    ad.charges_montant_forfait
  );

  if (isLocked || !hasSupplementaryInfo) return null;

  return (
    <Box
      sx={{
        mb,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(0,0,0,0.02)',
        }}
      >
        <Star sx={{ fontSize: 15, color: 'primary.main' }} />
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ letterSpacing: 0.1 }}
        >
          Informations supplémentaires
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, py: 1.5 }}>
        {/* Deposit */}
        {ad.deposit_amount && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWallet
                sx={{ fontSize: 15, color: 'text.disabled' }}
              />
              <Typography variant="body2" color="text.secondary">
                Dépôt de garantie
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {ad.deposit_amount}
            </Typography>
          </Box>
        )}

        {/* Minimum lease duration */}
        {ad.minimum_lease_duration && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.1,
              borderBottom:
                ad.charges_eau ||
                ad.charges_electricite ||
                ad.charges_autres ||
                ad.charges_forfaitaires ||
                ad.detailed_charges ||
                ad.property_condition_pdf
                  ? '1px solid'
                  : 'none',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 15, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                Durée minimum
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {ad.minimum_lease_duration}
            </Typography>
          </Box>
        )}

        {/* Charges */}
        {(ad.charges_eau ||
          ad.charges_electricite ||
          ad.charges_autres ||
          ad.charges_forfaitaires ||
          ad.detailed_charges) && (
          <Box sx={{ pt: 1.25 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.disabled"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                display: 'block',
                mb: 0.75,
              }}
            >
              Charges
            </Typography>

            {ad.detailed_charges && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  py: 0.9,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={ICON_SLOT_SX}>
                    <ReceiptLong
                      sx={{ fontSize: 14, color: 'text.disabled' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Détail
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    textAlign: 'right',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '60%',
                    pl: 1,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {ad.detailed_charges}
                </Typography>
              </Box>
            )}

            {ad.charges_forfaitaires && ad.charges_montant_forfait && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.9,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={ICON_SLOT_SX}>
                    <ReceiptLong sx={{ fontSize: 14, color: '#64748B' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Forfait mensuel
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    textAlign: 'right',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '60%',
                    pl: 1,
                  }}
                >
                  {Number(ad.charges_montant_forfait).toLocaleString('fr-FR')}{' '}
                  {CURRENCY_SYMBOL}/mois
                </Typography>
              </Box>
            )}

            {ad.charges_eau && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.9,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={ICON_SLOT_SX}>
                    <WaterDrop sx={{ fontSize: 14, color: '#3B82F6' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Eau
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    textAlign: 'right',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '60%',
                    pl: 1,
                  }}
                >
                  {Number(ad.charges_eau).toLocaleString('fr-FR')}{' '}
                  {CURRENCY_SYMBOL}/mois
                </Typography>
              </Box>
            )}

            {ad.charges_electricite && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.9,
                  borderBottom:
                    ad.charges_autres || ad.property_condition_pdf
                      ? '1px solid'
                      : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={ICON_SLOT_SX}>
                    <Bolt sx={{ fontSize: 14, color: '#F59E0B' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Électricité
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    textAlign: 'right',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '60%',
                    pl: 1,
                  }}
                >
                  {Number(ad.charges_electricite).toLocaleString('fr-FR')}{' '}
                  {CURRENCY_SYMBOL}/mois
                </Typography>
              </Box>
            )}

            {ad.charges_autres && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  py: 0.9,
                  borderBottom: ad.property_condition_pdf
                    ? '1px solid'
                    : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={ICON_SLOT_SX}>
                    <ReceiptLong sx={{ fontSize: 14, color: '#64748B' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Autres
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    textAlign: 'right',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '60%',
                    pl: 1,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {ad.charges_autres}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* PDF — état des lieux */}
        {ad.property_condition_pdf && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pt: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: 'rgba(239,68,68,0.08)',
                flexShrink: 0,
              }}
            >
              <Description sx={{ fontSize: 15, color: '#EF4444' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                État des lieux (PDF)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
              <Button
                variant="outlined"
                size="small"
                component="a"
                href={ad.property_condition_pdf}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderRadius: 1.5,
                  py: 0.4,
                  px: 1.25,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'text.secondary' },
                }}
              >
                Voir
              </Button>
              <Button
                variant="outlined"
                size="small"
                component="a"
                href={ad.property_condition_pdf + '?download=1'}
                download
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderRadius: 1.5,
                  py: 0.4,
                  px: 1.25,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'text.secondary' },
                }}
              >
                Télécharger
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
