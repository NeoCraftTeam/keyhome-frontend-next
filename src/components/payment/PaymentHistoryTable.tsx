'use client';

import PaymentAmountDisplay from '@/components/payment/PaymentAmountDisplay';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerBox } from '@/components/ui/ShimmerCard';
import { paymentsService } from '@/services/payments.service';
import { PaymentHistoryItem } from '@/types';
import DownloadIcon from '@mui/icons-material/PictureAsPdf';
import Toll from '@mui/icons-material/Toll';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
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
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  unlock: 'Déblocage',
  subscription: 'Abonnement',
  boost: 'Boost',
  credit: 'Crédits',
};

interface PaymentHistoryTableProps {
  perPage?: number;
}

export default function PaymentHistoryTable({
  perPage = 15,
}: PaymentHistoryTableProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(1);
  const [exportPeriod, setExportPeriod] = useState<30 | 90 | 365 | undefined>(
    undefined
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await paymentsService.exportPdf(exportPeriod);
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payment-history', page],
    queryFn: () => paymentsService.getHistory(page),
    staleTime: 30_000,
  });

  const items: PaymentHistoryItem[] = data?.data ?? [];
  const totalPages: number = data?.meta?.last_page ?? 1;

  const formatDate = (iso: string): string =>
    new Intl.DateTimeFormat('fr-CM', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const ExportBar = (
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
      {([undefined, 30, 90, 365] as const).map((p) => (
        <Chip
          key={String(p)}
          label={
            p === undefined
              ? 'Tout'
              : p === 30
                ? '30j'
                : p === 90
                  ? '90j'
                  : '1an'
          }
          size="small"
          variant={exportPeriod === p ? 'filled' : 'outlined'}
          color={exportPeriod === p ? 'primary' : 'default'}
          onClick={() => setExportPeriod(p)}
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
              isExporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={handleExportPdf}
            disabled={isExporting || items.length === 0}
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

  if (isMobile) {
    return (
      <Box>
        {ExportBar}
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
            <Paper
              key={item.id}
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
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {item.pack_name ?? TYPE_LABELS[item.type] ?? item.type}
                  </Typography>
                  {item.points_awarded != null && (
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
                  )}
                </Box>
                <PaymentStatusBadge status={item.status} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <PaymentAmountDisplay
                  amount={item.amount}
                  variant="body2"
                  fontWeight={700}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(item.created_at)}
                </Typography>
              </Box>
            </Paper>
          ))
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {ExportBar}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
          overflowX: 'auto',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50' }}
            >
              {['Pack', 'Crédits', 'Montant', 'Statut', 'Date'].map(
                (header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      py: 1.5,
                    }}
                  >
                    {header}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(perPage, 8) }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }, (__, j) => (
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
                <TableCell colSpan={5} sx={{ py: 2 }}>
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
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'grey.50',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.pack_name ?? TYPE_LABELS[item.type] ?? item.type}
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
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Toll sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
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
                    {formatDate(item.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
