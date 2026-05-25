'use client';

import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import {
  ownerService,
  type Expense,
  type ExpensePayload,
} from '@/services/owner.service';
import {
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import FadeIn from '@/components/ui/layout/FadeIn';
import { brandAgent, neutral, semantic } from '@/theme/tokens';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const EXPENSE_CATEGORIES: { value: Expense['category']; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'tax', label: 'Taxes' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'utilities', label: 'Charges' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'other', label: 'Autre' },
];

const PIE_COLORS = [
  brandAgent.primary,
  semantic.warning,
  semantic.indigo,
  brandAgent.accent,
  semantic.successBright,
  neutral.slate400,
];

const EMPTY_FORM: ExpensePayload = {
  amount: 0,
  category: 'other',
  description: '',
  expense_date: new Date().toISOString().split('T')[0],
};

function formatCurrency(n: number) {
  return n.toLocaleString('fr-FR') + ' XAF';
}

export default function OwnerFinancialsPage() {
  const queryClient = useQueryClient();
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [expensePage, setExpensePage] = useState(1);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [form, setForm] = useState<ExpensePayload>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['owner-my-ads-select'],
    queryFn: ({ signal }) =>
      ownerService.getMyAds({ per_page: 100 }, { signal }),
    select: (res) => (res?.data ?? []) as Array<{ id: string; title: string }>,
  });

  const { data: profitLoss, isLoading: profitLoading } = useQuery({
    queryKey: ['owner-profit-loss', selectedAdId],
    queryFn: ({ signal }) =>
      ownerService.getProfitLoss(selectedAdId, { signal }),
    enabled: Boolean(selectedAdId),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['owner-expenses', selectedAdId, expensePage],
    queryFn: ({ signal }) =>
      ownerService.getExpenses(selectedAdId, { page: expensePage }, { signal }),
    enabled: Boolean(selectedAdId),
  });

  const expenses = expensesData?.data ?? [];
  const expensesMeta = expensesData?.meta;

  const createExpenseMutation = useMutation({
    mutationFn: (payload: ExpensePayload) =>
      ownerService.createExpense(selectedAdId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-expenses', selectedAdId],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner-profit-loss', selectedAdId],
      });
      setAddExpenseOpen(false);
      setForm(EMPTY_FORM);
      setSnackbar({
        message: 'Dépense ajoutée avec succès',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({ message: "Erreur lors de l'ajout", severity: 'error' });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => ownerService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-expenses', selectedAdId],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner-profit-loss', selectedAdId],
      });
      setDeleteTarget(null);
      setSnackbar({ message: 'Dépense supprimée', severity: 'success' });
    },
    onError: () => {
      setSnackbar({
        message: 'Erreur lors de la suppression',
        severity: 'error',
      });
    },
  });

  const pieData = profitLoss?.expenses_by_category
    ? Object.entries(profitLoss.expenses_by_category)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: EXPENSE_CATEGORIES.find((c) => c.value === key)?.label ?? key,
          value,
        }))
    : [];

  const getCategoryLabel = (cat: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Finances' },
          ]}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Finances
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Suivez vos revenus, dépenses et bénéfice net par bien.
        </Typography>
      </FadeIn>

      {/* Ad selector */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="ad-select-label">Sélectionnez un bien</InputLabel>
            <Select
              labelId="ad-select-label"
              value={selectedAdId}
              label="Sélectionnez un bien"
              onChange={(e) => {
                setSelectedAdId(e.target.value);
                setExpensePage(1);
              }}
              disabled={adsLoading}
            >
              {adsLoading ? (
                <MenuItem disabled>Chargement…</MenuItem>
              ) : (
                (adsData ?? []).map((ad) => (
                  <MenuItem key={ad.id} value={ad.id}>
                    <Typography
                      component="span"
                      variant="body2"
                      noWrap
                      title={ad.title}
                      sx={{ display: 'block', maxWidth: '100%' }}
                    >
                      {ad.title}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {!selectedAdId ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 6,
            textAlign: 'center',
          }}
        >
          <AccountBalanceIcon
            sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Sélectionnez un bien pour voir les finances
          </Typography>
          <Typography color="text.secondary">
            Choisissez un bien immobilier ci-dessus pour consulter son bilan
            financier.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Profit/Loss Summary */}
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={700}
              >
                Bilan financier
              </Typography>
              {profitLoading ? (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Skeleton variant="text" height={40} />
                  <Skeleton variant="text" height={40} />
                  <Skeleton variant="text" height={40} />
                </Stack>
              ) : (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mt: 2 }}
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total dépenses
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="error.main"
                    >
                      {formatCurrency(profitLoss?.total_expenses ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Revenus (contrats)
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(profitLoss?.contract_revenue ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Revenu net
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={
                        (profitLoss?.net_income ?? 0) >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {formatCurrency(profitLoss?.net_income ?? 0)}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Pie chart */}
          {!profitLoading && pieData.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={700}
                >
                  Dépenses par catégorie
                </Typography>
                <Box sx={{ height: 280, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [
                          formatCurrency(Number(value ?? 0)),
                          '',
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Expenses list */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2, gap: 2, flexWrap: 'wrap', minWidth: 0 }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ minWidth: 0, flex: '1 1 200px' }}
            >
              Dépenses
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setForm(EMPTY_FORM);
                setAddExpenseOpen(true);
              }}
              disabled={createExpenseMutation.isPending}
              sx={{ borderRadius: 2, textTransform: 'none', flexShrink: 0 }}
            >
              Ajouter
            </Button>
          </Stack>

          {expensesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={72}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          ) : expenses.length === 0 ? (
            <Card
              sx={{
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary">
                Aucune dépense enregistrée pour ce bien.
              </Typography>
            </Card>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {expenses.map((expense) => (
                  <Card
                    key={expense.id}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <CardContent sx={{ py: '12px !important', px: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Typography fontWeight={700} color="error.main">
                              {formatCurrency(expense.amount)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: 'action.selected',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontWeight: 600,
                              }}
                            >
                              {getCategoryLabel(expense.category)}
                            </Typography>
                          </Stack>
                          {expense.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                mt: 0.25,
                              }}
                              title={expense.description}
                            >
                              {expense.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled">
                            {new Date(expense.expense_date).toLocaleDateString(
                              'fr-FR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </Typography>
                        </Box>
                        <Tooltip title="Supprimer">
                          <IconButton
                            aria-label="Supprimer cette dépense"
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(expense)}
                            disabled={deleteExpenseMutation.isPending}
                            sx={{ borderRadius: 1.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {expensesMeta && expensesMeta.last_page > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={expensesMeta.last_page}
                    page={expensePage}
                    onChange={(_, value) => {
                      setExpensePage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Add Expense Dialog */}
      <Dialog
        open={addExpenseOpen}
        onClose={() => {
          if (createExpenseMutation.isPending) return;
          setAddExpenseOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Ajouter une dépense</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Montant (XAF) *"
              type="number"
              value={form.amount || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: Number(e.target.value) }))
              }
              fullWidth
              autoFocus
              inputProps={{ min: 0 }}
            />
            <FormControl fullWidth>
              <InputLabel id="category-label">Catégorie *</InputLabel>
              <Select
                labelId="category-label"
                value={form.category}
                label="Catégorie *"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as Expense['category'],
                  }))
                }
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={form.description ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Date de la dépense *"
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, expense_date: e.target.value }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setAddExpenseOpen(false)}
            variant="outlined"
            disabled={createExpenseMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => createExpenseMutation.mutate(form)}
            variant="contained"
            disabled={
              createExpenseMutation.isPending ||
              !form.amount ||
              !form.expense_date
            }
            startIcon={
              createExpenseMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
            sx={{ borderRadius: 2 }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (deleteExpenseMutation.isPending) return;
          setDeleteTarget(null);
        }}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Supprimer la dépense ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Supprimer cette dépense de{' '}
            <strong>
              {deleteTarget ? formatCurrency(deleteTarget.amount) : ''}
            </strong>{' '}
            ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            disabled={deleteExpenseMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() =>
              deleteTarget && deleteExpenseMutation.mutate(deleteTarget.id)
            }
            color="error"
            variant="contained"
            disabled={deleteExpenseMutation.isPending}
            startIcon={
              deleteExpenseMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
            sx={{ borderRadius: 2 }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity}
          onClose={() => setSnackbar(null)}
          sx={{ borderRadius: 2 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
