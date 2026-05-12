'use client';

import PaymentAmountDisplay from '@/components/payment/PaymentAmountDisplay';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import {
  formatPaymentHistoryDate,
  paymentHistoryMethodPrimary,
  paymentHistoryMethodSecondary,
} from '@/lib/payment-history-display';
import { paymentKeys } from '@/lib/query-keys';
import { paymentsService } from '@/services/payments.service';
import { useCurrency } from '@/providers/CurrencyProvider';
import type { PaymentHistoryItem } from '@/types';
import DateIcon from '@mui/icons-material/DateRange';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditsIcon from '@mui/icons-material/Toll';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  unlock: 'Déblocage',
  subscription: 'Abonnement',
  boost: 'Boost',
  credit: 'Crédits',
};

const PERIOD_CHIPS_MOBILE = [
  { value: 'all' as const, label: 'Tout' },
  { value: '30' as const, label: '30 jours' },
  { value: '90' as const, label: '90 jours' },
  { value: '365' as const, label: '1 an' },
] as const;

const PERIOD_CHIPS_DESKTOP = [
  { value: 'all' as const, label: 'Tout' },
  { value: '30' as const, label: '30j' },
  { value: '90' as const, label: '90j' },
  { value: '365' as const, label: '1an' },
] as const;

const TABLE_HEADERS = [
  'Date',
  'Description',
  'Réf.',
  'Crédits',
  'Montant',
  'Méthode',
  'Statut',
  '',
] as const;

interface ModernMobilePaymentCardProps {
  readonly item: PaymentHistoryItem;
  readonly receiptBusyId: string | null;
  readonly onReceipt: (id: string) => void;
}

const ModernMobilePaymentCard = memo(function ModernMobilePaymentCard({
  item,
  receiptBusyId,
  onReceipt,
}: ModernMobilePaymentCardProps): ReactElement {
  const title = item.pack_name ?? TYPE_LABELS[item.type] ?? item.type;
  const primary = paymentHistoryMethodPrimary(item);
  const secondary = paymentHistoryMethodSecondary(item);
  const methodTooltip = `${primary}${secondary ? ` — ${secondary}` : ''}`;

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatPaymentHistoryDate(item.created_at)}
              </Typography>
            </Box>
            {item.reference ? (
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', color: 'text.disabled' }}
              >
                Réf: {item.reference.slice(0, 12)}…
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
            }}
          >
            <PaymentStatusBadge status={item.status} />
            <Tooltip title="Reçu PDF">
              <IconButton
                size="small"
                onClick={() => onReceipt(item.id)}
                disabled={receiptBusyId === item.id}
                sx={{ color: '#F6475F' }}
                aria-label="Télécharger le reçu"
              >
                {receiptBusyId === item.id ? (
                  <CircularProgress size={18} />
                ) : (
                  <PdfIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.points_awarded != null ? (
              <Chip
                icon={<CreditsIcon sx={{ fontSize: 14 }} />}
                label={`${item.points_awarded} crédits`}
                size="small"
                color="primary"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            ) : null}
            <PaymentAmountDisplay
              amount={item.amount}
              variant="body1"
              fontWeight={700}
            />
          </Box>
          <Tooltip title={methodTooltip}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'right', maxWidth: 180 }}
            >
              {primary}
              {secondary ? (
                <>
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.68rem',
                    }}
                  >
                    {secondary}
                  </Box>
                </>
              ) : null}
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
});

interface ModernDesktopRowProps {
  readonly item: PaymentHistoryItem;
  readonly isDark: boolean;
  readonly receiptBusyId: string | null;
  readonly onReceipt: (id: string) => void;
}

const ModernDesktopRow = memo(function ModernDesktopRow({
  item,
  isDark,
  receiptBusyId,
  onReceipt,
}: ModernDesktopRowProps): ReactElement {
  const title = item.pack_name ?? TYPE_LABELS[item.type] ?? item.type;
  const primary = paymentHistoryMethodPrimary(item);
  const secondary = paymentHistoryMethodSecondary(item);

  return (
    <TableRow
      sx={{
        '&:hover': {
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'grey.50',
        },
      }}
    >
      <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
        {formatPaymentHistoryDate(item.created_at)}
      </TableCell>
      <TableCell sx={{ maxWidth: 200 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {title}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>
        {item.reference ? (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }} noWrap>
            {item.reference.slice(0, 14)}…
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {item.points_awarded != null ? (
          <Chip
            icon={<CreditsIcon sx={{ fontSize: 14 }} />}
            label={item.points_awarded.toString()}
            size="small"
            color="primary"
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <PaymentAmountDisplay
          amount={item.amount}
          variant="body2"
          fontWeight={700}
        />
      </TableCell>
      <TableCell sx={{ maxWidth: 200 }}>
        <Typography variant="body2" fontWeight={600}>
          {primary}
        </Typography>
        {secondary ? (
          <Typography variant="caption" color="text.secondary" display="block">
            {secondary}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={item.status} />
      </TableCell>
      <TableCell align="center" sx={{ width: 48 }}>
        <Tooltip title="Reçu PDF">
          <IconButton
            size="small"
            onClick={() => onReceipt(item.id)}
            disabled={receiptBusyId === item.id}
            aria-label="Télécharger le reçu"
            sx={{ color: '#F6475F' }}
          >
            {receiptBusyId === item.id ? (
              <CircularProgress size={18} />
            ) : (
              <PdfIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

interface PaymentHistoryTableModernProps {
  perPage?: number;
}

export default function PaymentHistoryTableModern({
  perPage = 10,
}: PaymentHistoryTableModernProps): ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const { currency, convert } = useCurrency();
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'all' | '30' | '90' | '365'
  >('all');
  const [isExporting, setIsExporting] = useState(false);
  const [receiptBusyId, setReceiptBusyId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: paymentKeys.list(perPage, page),
    queryFn: () => paymentsService.getHistory({ page, perPage }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 600_000,
  });

  const items: PaymentHistoryItem[] = data?.data ?? [];
  const meta = data?.meta;
  const totalRows = meta?.total ?? 0;
  const lastPage = Math.max(meta?.last_page ?? 1, 1);

  const handleDownloadAll = useCallback(async () => {
    setIsExporting(true);
    try {
      const pdfPeriod =
        selectedPeriod === '30'
          ? 30
          : selectedPeriod === '90'
            ? 90
            : selectedPeriod === '365'
              ? 365
              : undefined;
      await paymentsService.exportPdf(
        pdfPeriod as 30 | 90 | 365 | undefined,
        currency,
        convert(1)
      );
    } catch (error) {
      console.error('Export PDF failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod, currency, convert]);

  const handleOneReceipt = useCallback(
    async (id: string) => {
      setReceiptBusyId(id);
      try {
        const rate = convert(1);
        await paymentsService.downloadReceipt(id, {
          currency:
            currency !== 'XAF' && currency !== 'XOF' ? currency : undefined,
          rate: currency !== 'XAF' && currency !== 'XOF' ? rate : undefined,
        });
      } finally {
        setReceiptBusyId(null);
      }
    },
    [currency, convert]
  );

  const handlePageChange = useCallback((_: unknown, value: number) => {
    setPage(value);
  }, []);

  const handlePeriodChange = useCallback(
    (value: 'all' | '30' | '90' | '365') => {
      setSelectedPeriod(value);
    },
    []
  );

  if (isMobile) {
    return (
      <Box>
        {/* Header with filters */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Historique des paiements
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={
                  isExporting ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <PdfIcon />
                  )
                }
                onClick={handleDownloadAll}
                disabled={isExporting || totalRows === 0}
                sx={{
                  borderRadius: 2,
                  bgcolor: '#F6475F',
                  '&:hover': { bgcolor: '#c73048' },
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {isExporting ? 'Génération…' : 'PDF'}
              </Button>
            </Box>

            {/* Period filter */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {PERIOD_CHIPS_MOBILE.map((period) => (
                <Chip
                  key={period.value}
                  label={period.label}
                  onClick={() => handlePeriodChange(period.value)}
                  variant={
                    selectedPeriod === period.value ? 'filled' : 'outlined'
                  }
                  size="small"
                  color={
                    selectedPeriod === period.value ? 'primary' : 'default'
                  }
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Période appliquée au PDF uniquement (pas au tableau).
            </Typography>
          </CardContent>
        </Card>

        {isFetching && !isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
          </Box>
        ) : null}

        {isLoading ? (
          Array.from({ length: perPage }, (_, i) => (
            <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Skeleton height={20} width="60%" sx={{ mb: 1 }} />
                <Skeleton height={16} width="40%" />
                <Skeleton height={16} width="80%" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
            <ReceiptIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune transaction trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vous n&apos;avez aucune transaction pour le moment.
            </Typography>
          </Card>
        ) : (
          items.map((item) => (
            <ModernMobilePaymentCard
              key={item.id}
              item={item}
              receiptBusyId={receiptBusyId}
              onReceipt={handleOneReceipt}
            />
          ))
        )}

        {lastPage > 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={lastPage}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              siblingCount={0}
            />
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Historique des paiements
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Period filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PERIOD_CHIPS_DESKTOP.map((period) => (
                <Chip
                  key={period.value}
                  label={period.label}
                  onClick={() => handlePeriodChange(period.value)}
                  variant={
                    selectedPeriod === period.value ? 'filled' : 'outlined'
                  }
                  size="small"
                  color={
                    selectedPeriod === period.value ? 'primary' : 'default'
                  }
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Download button */}
            <Button
              variant="contained"
              startIcon={
                isExporting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PdfIcon />
                )
              }
              onClick={handleDownloadAll}
              disabled={isExporting || totalRows === 0}
              size="small"
              sx={{
                borderRadius: 2,
                bgcolor: '#F6475F',
                '&:hover': { bgcolor: '#c73048' },
                boxShadow: 'none',
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {isExporting ? 'Génération…' : 'Télécharger PDF'}
            </Button>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Les pastilles de période s&apos;appliquent uniquement au PDF
          téléchargé.
        </Typography>

        {meta ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {totalRows} transaction{totalRows > 1 ? 's' : ''} au total · page{' '}
            {meta.current_page} sur {meta.last_page}
          </Typography>
        ) : null}
      </Paper>

      {/* Loading indicator */}
      {isFetching && !isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
        </Box>
      ) : null}

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" sx={{ minWidth: isMdDown ? 900 : 820 }}>
          <TableHead>
            <TableRow
              sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50' }}
            >
              {TABLE_HEADERS.map((header, idx) => (
                <TableCell
                  key={`${header}-${idx}`}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    py: 1.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: perPage }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }, (__, j) => (
                    <TableCell key={j}>
                      <Skeleton
                        height={20}
                        width={j === 0 ? 120 : j === 4 ? 80 : 60}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                  <ReceiptIcon
                    sx={{
                      fontSize: 48,
                      color: 'text.secondary',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Aucune transaction trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <ModernDesktopRow
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  receiptBusyId={receiptBusyId}
                  onReceipt={handleOneReceipt}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {lastPage > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={lastPage}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            siblingCount={1}
          />
        </Box>
      ) : null}
    </Box>
  );
}
