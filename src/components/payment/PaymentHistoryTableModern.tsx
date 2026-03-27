'use client';

import PaymentAmountDisplay from '@/components/payment/PaymentAmountDisplay';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import { paymentsService } from '@/services/payments.service';
import { PaymentHistoryItem } from '@/types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
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
import {
  CloudDownload as DownloadIcon,
  DateRange as DateIcon,
  FilterList,
  Receipt as ReceiptIcon,
  Toll as CreditsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

const TYPE_LABELS: Record<string, string> = {
  unlock: 'Déblocage',
  subscription: 'Abonnement',
  boost: 'Boost',
  credit: 'Crédits',
};

const METHOD_LABELS: Record<string, string> = {
  mobile_money: 'MTN MoMo',
  orange_money: 'Orange Money',
  card: 'Carte',
  flutterwave: 'Flutterwave',
};

interface PaymentHistoryTableModernProps {
  perPage?: number;
}

export default function PaymentHistoryTableModern({ perPage = 15 }: PaymentHistoryTableModernProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30' | '90' | '365'>('all');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['payment-history', page, selectedPeriod],
    queryFn: () => paymentsService.getHistory(page),
    staleTime: 30_000,
  });

  const items: PaymentHistoryItem[] = data?.data ?? [];
  const totalPages: number = data?.meta?.last_page ?? 1;

  // Filter items based on selected period
  const filteredItems = useMemo(() => {
    if (selectedPeriod === 'all') return items;
    
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - parseInt(selectedPeriod));
    
    return items.filter(item => new Date(item.created_at) >= daysAgo);
  }, [items, selectedPeriod]);

  const formatDate = (iso: string): string =>
    new Intl.DateTimeFormat('fr-CM', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(iso));

  const handleDownloadAll = async () => {
    try {
      // In a real app, this would generate and download a CSV/PDF
      const csvContent = [
        ['Date', 'Type', 'Pack', 'Méthode', 'Montant', 'Crédits', 'Statut', 'Référence'],
        ...items.map(item => [
          formatDate(item.created_at),
          TYPE_LABELS[item.type] || item.type,
          item.pack_name || '—',
          METHOD_LABELS[item.payment_method as string] || item.payment_method,
          `${item.amount} XOF`,
          item.points_awarded?.toString() || '—',
          item.status,
          item.reference || '—'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyhome-paiements-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isMobile) {
    return (
      <Box>
        {/* Header with filters */}
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Historique des paiements
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
                disabled={items.length === 0}
                sx={{ borderRadius: 2 }}
              >
                Télécharger tout
              </Button>
            </Box>
            
            {/* Period filter */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'Tout' },
                { value: '30', label: '30 jours' },
                { value: '90', label: '90 jours' },
                { value: '365', label: '1 an' },
              ].map((period) => (
                <Chip
                  key={period.value}
                  label={period.label}
                  onClick={() => setSelectedPeriod(period.value as any)}
                  variant={selectedPeriod === period.value ? 'filled' : 'outlined'}
                  size="small"
                  color={selectedPeriod === period.value ? 'primary' : 'default'}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {isFetching && !isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
          </Box>
        )}

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
        ) : filteredItems.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune transaction trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedPeriod === 'all' 
                ? 'Vous n\'avez aucune transaction pour le moment.'
                : `Aucune transaction sur les ${selectedPeriod === '30' ? '30' : selectedPeriod === '90' ? '90' : '365'} derniers jours.`
              }
            </Typography>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {item.pack_name ?? TYPE_LABELS[item.type] ?? item.type}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.created_at)}
                      </Typography>
                    </Box>
                    {item.reference && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                        Réf: {item.reference.slice(0, 12)}...
                      </Typography>
                    )}
                  </Box>
                  <PaymentStatusBadge status={item.status} />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.points_awarded != null && (
                      <Chip
                        icon={<CreditsIcon sx={{ fontSize: 14 }} />}
                        label={`${item.points_awarded} crédits`}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <PaymentAmountDisplay amount={item.amount} variant="body1" fontWeight={700} />
                  </Box>
                  <Tooltip title="Méthode de paiement">
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                      {METHOD_LABELS[item.payment_method as string] || item.payment_method}
                    </Typography>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              sx={{ borderRadius: 2 }}
            >
              Charger plus
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Historique des paiements
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Period filter */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { value: 'all', label: 'Tout' },
                { value: '30', label: '30j' },
                { value: '90', label: '90j' },
                { value: '365', label: '1an' },
              ].map((period) => (
                <Chip
                  key={period.value}
                  label={period.label}
                  onClick={() => setSelectedPeriod(period.value as any)}
                  variant={selectedPeriod === period.value ? 'filled' : 'outlined'}
                  size="small"
                  color={selectedPeriod === period.value ? 'primary' : 'default'}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            {/* Download button */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadAll}
              disabled={items.length === 0}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Télécharger CSV
            </Button>
          </Box>
        </Box>

        {/* Summary stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Card sx={{ flex: 1, p: 2, textAlign: 'center', borderRadius: 2, bgcolor: isDark ? 'rgba(246,71,95,0.04)' : 'rgba(246,71,95,0.02)' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total des transactions
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              {items.length}
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: 2, textAlign: 'center', borderRadius: 2, bgcolor: isDark ? 'rgba(46,125,50,0.04)' : 'rgba(46,125,50,0.02)' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Crédits obtenus
            </Typography>
            <Typography variant="h6" fontWeight={800} color="success.main">
              {items.reduce((sum, item) => sum + (item.points_awarded || 0), 0)}
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: 2, textAlign: 'center', borderRadius: 2, bgcolor: isDark ? 'rgba(25,135,84,0.04)' : 'rgba(25,135,84,0.02)' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Montant total
            </Typography>
            <Typography variant="h6" fontWeight={800} color="info.main">
              {items.reduce((sum, item) => sum + item.amount, 0).toLocaleString('fr-CM')} XOF
            </Typography>
          </Card>
        </Box>
      </Paper>

      {/* Loading indicator */}
      {isFetching && !isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
        </Box>
      )}

      {/* Table */}
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
            <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.50' }}>
              {['Date', 'Type', 'Pack', 'Crédits', 'Montant', 'Méthode', 'Statut'].map((header) => (
                <TableCell
                  key={header}
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.75rem', 
                    letterSpacing: 0.5, 
                    textTransform: 'uppercase', 
                    color: 'text.secondary', 
                    py: 1.5,
                    whiteSpace: 'nowrap'
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
                  {Array.from({ length: 7 }, (__, j) => (
                    <TableCell key={j}>
                      <Skeleton height={20} width={j === 0 ? 120 : j === 4 ? 80 : 60} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune transaction trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'grey.50',
                      cursor: 'pointer'
                    } 
                  }}
                >
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {item.pack_name ?? TYPE_LABELS[item.type] ?? item.type}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {item.reference ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {item.reference.slice(0, 10)}...
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
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
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <PaymentAmountDisplay amount={item.amount} variant="body2" fontWeight={700} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {METHOD_LABELS[item.payment_method as string] || item.payment_method}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            sx={{ borderRadius: 2 }}
          >
            Charger plus de transactions
          </Button>
        </Box>
      )}
    </Box>
  );
}
