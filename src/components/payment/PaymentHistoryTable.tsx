'use client';

import PaymentAmountDisplay from '@/components/payment/PaymentAmountDisplay';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { ShimmerBox } from '@/components/ui/feedback/ShimmerCard';
import {
  formatPaymentHistoryDate,
  paymentHistoryMethodPrimary,
  paymentHistoryMethodSecondary,
} from '@/lib/payment/payment-history-display';
import { paymentKeys } from '@/lib/query-keys';
import { paymentsService } from '@/services/payments.service';
import { useCurrency } from '@/providers/CurrencyProvider';
import type { PaymentHistoryItem } from '@/types';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import Toll from '@mui/icons-material/Toll';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
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

const EXPORT_PERIOD_VALUES = [
  undefined,
  30,
  90,
  365,
] as const satisfies ReadonlyArray<30 | 90 | 365 | undefined>;

function exportPeriodChipLabel(
  p: (typeof EXPORT_PERIOD_VALUES)[number]
): string {
  if (p === undefined) {
    return 'Tout';
  }
  if (p === 30) {
    return '30j';
  }
  if (p === 90) {
    return '90j';
  }
  return '1an';
}

interface PaymentHistoryClassicExportBarProps {
  readonly isDark: boolean;
  readonly exportPeriod: 30 | 90 | 365 | undefined;
  readonly onExportPeriod: (p: 30 | 90 | 365 | undefined) => void;
  readonly isExporting: boolean;
  readonly totalRows: number;
  readonly onExportPdf: () => void;
}

const PaymentHistoryClassicExportBar = memo(
  function PaymentHistoryClassicExportBar({
    isDark,
    exportPeriod,
    onExportPeriod,
    isExporting,
    totalRows,
    onExportPdf,
  }: PaymentHistoryClassicExportBarProps): ReactElement {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>
          Exporter :
        </Typography>
        {EXPORT_PERIOD_VALUES.map((p) => (
          <Chip
            key={String(p)}
            label={exportPeriodChipLabel(p)}
            size="small"
            variant={exportPeriod === p ? 'filled' : 'outlined'}
            color={exportPeriod === p ? 'primary' : 'default'}
            onClick={() => onExportPeriod(p)}
            sx={{ borderRadius: 2 }}
          />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Télécharger l'historique en PDF">
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={
                isExporting ? <ButtonSpinner size={14} /> : <PdfIcon />
              }
              onClick={onExportPdf}
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
              {isExporting ? 'Génération…' : 'Télécharger PDF'}
            </Button>
          </span>
        </Tooltip>
      </Paper>
    );
  }
);

const TABLE_HEADERS = [
  'Pack',
  'Crédits',
  'Montant',
  'Moyen',
  'Statut',
  'Date',
  'PDF',
] as const;

interface ClassicMobilePaymentCardProps {
  readonly item: PaymentHistoryItem;
  readonly isDark: boolean;
  readonly receiptBusyId: string | null;
  readonly onReceipt: (id: string) => void;
}

const ClassicMobilePaymentCard = memo(function ClassicMobilePaymentCard({
  item,
  isDark,
  receiptBusyId,
  onReceipt,
}: ClassicMobilePaymentCardProps): ReactElement {
  const title = item.pack_name ?? TYPE_LABELS[item.type] ?? item.type;
  const methodPrimary = paymentHistoryMethodPrimary(item);
  const methodSecondary = paymentHistoryMethodSecondary(item);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
        transition: 'border-color 0.15s',
      }}
    >
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
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {item.points_awarded != null ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
              }}
            >
              <Toll sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography
                variant="caption"
                fontWeight={600}
                color="primary.main"
              >
                {item.points_awarded} crédits
              </Typography>
            </Box>
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
          <Tooltip title="Télécharger le reçu (PDF)">
            <IconButton
              size="small"
              aria-label="Télécharger le reçu PDF"
              onClick={() => onReceipt(item.id)}
              disabled={receiptBusyId === item.id}
              sx={{ color: '#F6475F' }}
            >
              {receiptBusyId === item.id ? (
                <ButtonSpinner size={18} />
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
          mt: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {methodPrimary}
          {methodSecondary ? ` · ${methodSecondary}` : ''}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <PaymentAmountDisplay
          amount={item.amount}
          variant="body2"
          fontWeight={700}
        />
        <Typography variant="caption" color="text.secondary">
          {formatPaymentHistoryDate(item.created_at)}
        </Typography>
      </Box>
    </Paper>
  );
});

interface ClassicDesktopRowProps {
  readonly item: PaymentHistoryItem;
  readonly isDark: boolean;
  readonly receiptBusyId: string | null;
  readonly onReceipt: (id: string) => void;
}

const ClassicDesktopRow = memo(function ClassicDesktopRow({
  item,
  isDark,
  receiptBusyId,
  onReceipt,
}: ClassicDesktopRowProps): ReactElement {
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
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: 'monospace' }}
        >
          {item.reference ? item.reference.slice(0, 14) : '—'}
        </Typography>
      </TableCell>
      <TableCell>
        {item.points_awarded != null ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Toll sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {item.points_awarded}
            </Typography>
          </Box>
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
      <TableCell
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          whiteSpace: 'nowrap',
        }}
      >
        {formatPaymentHistoryDate(item.created_at)}
      </TableCell>
      <TableCell align="center" sx={{ width: 56 }}>
        <Tooltip title="Reçu PDF">
          <IconButton
            size="small"
            onClick={() => onReceipt(item.id)}
            disabled={receiptBusyId === item.id}
            aria-label="Télécharger le reçu"
            sx={{ color: '#F6475F' }}
          >
            {receiptBusyId === item.id ? (
              <ButtonSpinner size={18} />
            ) : (
              <PdfIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

interface PaymentHistoryTableProps {
  perPage?: number;
}

export default function PaymentHistoryTable({
  perPage = 10,
}: PaymentHistoryTableProps): ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const { currency, convert } = useCurrency();
  const [page, setPage] = useState(1);
  const [exportPeriod, setExportPeriod] = useState<30 | 90 | 365 | undefined>(
    undefined
  );
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

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalRows = meta?.total ?? 0;
  const lastPage = Math.max(meta?.last_page ?? 1, 1);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      await paymentsService.exportPdf(exportPeriod);
    } finally {
      setIsExporting(false);
    }
  }, [exportPeriod]);

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

  const handleExportPeriod = useCallback((p: 30 | 90 | 365 | undefined) => {
    setExportPeriod(p);
  }, []);

  if (isMobile) {
    return (
      <Box>
        <PaymentHistoryClassicExportBar
          isDark={isDark}
          exportPeriod={exportPeriod}
          onExportPeriod={handleExportPeriod}
          isExporting={isExporting}
          totalRows={totalRows}
          onExportPdf={handleExportPdf}
        />
        {isFetching && !isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
            <LinearProgress
              sx={{ width: '100%', maxWidth: 280, borderRadius: 2 }}
            />
          </Box>
        ) : null}
        {isLoading ? (
          Array.from({ length: Math.min(perPage, 6) }, (_, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ShimmerBox height={18} width="62%" sx={{ mb: 1.25 }} />
              <ShimmerBox height={14} width="38%" />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1.5,
                }}
              >
                <ShimmerBox height={16} width={72} />
                <ShimmerBox height={14} width={100} />
              </Box>
            </Paper>
          ))
        ) : items.length === 0 ? (
          <EmptyState
            variant="customer"
            size="md"
            title="Aucune transaction"
            description="Vos achats de crédits et abonnements apparaîtront ici."
          />
        ) : (
          items.map((item) => (
            <ClassicMobilePaymentCard
              key={item.id}
              item={item}
              isDark={isDark}
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
              color="primary"
              onChange={handlePageChange}
              showFirstButton
              showLastButton
              siblingCount={0}
              size="medium"
            />
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      <PaymentHistoryClassicExportBar
        isDark={isDark}
        exportPeriod={exportPeriod}
        onExportPeriod={handleExportPeriod}
        isExporting={isExporting}
        totalRows={totalRows}
        onExportPdf={handleExportPdf}
      />
      {isFetching && !isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
          <LinearProgress
            sx={{ width: '100%', maxWidth: 320, borderRadius: 2 }}
          />
        </Box>
      ) : null}
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
        <Table
          size="small"
          sx={{
            minWidth: isMdDown ? 720 : 640,
          }}
        >
          <TableHead>
            <TableRow
              sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50' }}
            >
              {TABLE_HEADERS.map((header) => (
                <TableCell
                  key={header}
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
              Array.from({ length: Math.min(perPage, 8) }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }, (__, j) => (
                    <TableCell key={j}>
                      <ShimmerBox
                        height={20}
                        width={j === 0 ? 120 : j === 2 ? 80 : 64}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 2 }}>
                  <EmptyState
                    variant="customer"
                    size="sm"
                    title="Aucune transaction"
                    description="Vos achats apparaîtront ici."
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <ClassicDesktopRow
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
            color="primary"
            onChange={handlePageChange}
            showFirstButton
            showLastButton
            siblingCount={1}
          />
        </Box>
      ) : null}
    </Box>
  );
}
