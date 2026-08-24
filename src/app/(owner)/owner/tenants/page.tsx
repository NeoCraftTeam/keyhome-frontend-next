'use client';

import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import {
  ownerService,
  type Tenant,
  type TenantPayload,
} from '@/services/owner.service';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PeopleAlt as PeopleAltIcon,
} from '@mui/icons-material';
import {
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
  Fab,
  IconButton,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import FadeIn from '@/components/ui/layout/FadeIn';

const EMPTY_FORM: TenantPayload = {
  name: '',
  phone: '',
  email: '',
  id_number: '',
  notes: '',
};

export default function OwnerTenantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantPayload>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['owner-tenants', page],
    queryFn: () => ownerService.getTenants({ page, per_page: 15 }),
  });

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: TenantPayload) => ownerService.createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-tenants'] });
      handleCloseDialog();
      setSnackbar({
        message: 'Locataire ajouté avec succès',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({ message: 'Erreur lors de la création', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<TenantPayload>) =>
      ownerService.updateTenant(editingTenant!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-tenants'] });
      handleCloseDialog();
      setSnackbar({
        message: 'Locataire mis à jour avec succès',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        message: 'Erreur lors de la mise à jour',
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownerService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-tenants'] });
      setDeleteTarget(null);
      setSnackbar({ message: 'Locataire supprimé', severity: 'success' });
    },
    onError: () => {
      setSnackbar({
        message: 'Erreur lors de la suppression',
        severity: 'error',
      });
    },
  });

  const openCreate = () => {
    setEditingTenant(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name,
      phone: tenant.phone ?? '',
      email: tenant.email ?? '',
      id_number: tenant.id_number ?? '',
      notes: tenant.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTenant(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      return;
    }
    const payload: TenantPayload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      id_number: form.id_number || null,
      notes: form.notes || null,
    };
    if (editingTenant) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Mes locataires' },
          ]}
        />
      </FadeIn>
      <FadeIn delay={0.05}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h4" fontWeight={700}>
            Locataires
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            Ajouter
          </Button>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Gérez vos locataires et consultez leurs contrats associés.
        </Typography>
      </FadeIn>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={100}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      ) : tenants.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 6,
            textAlign: 'center',
          }}
        >
          <PeopleAltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun locataire
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Commencez par ajouter un locataire pour gérer vos contrats.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Ajouter un locataire
          </Button>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tenants.map((tenant) => (
              <Card
                key={tenant.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 3 },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ sm: 'center' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {tenant.name}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ mt: 0.5 }}
                        flexWrap="wrap"
                      >
                        {tenant.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {tenant.phone}
                          </Typography>
                        )}
                        {tenant.email && (
                          <Typography variant="body2" color="text.secondary">
                            {tenant.email}
                          </Typography>
                        )}
                        {tenant.id_number && (
                          <Typography variant="body2" color="text.secondary">
                            CIN : {tenant.id_number}
                          </Typography>
                        )}
                      </Stack>
                      {typeof tenant.lease_contracts_count === 'number' && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {tenant.lease_contracts_count} contrat
                          {tenant.lease_contracts_count !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          aria-label="Modifier le locataire"
                          onClick={() => openEdit(tenant)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          aria-label="Supprimer le locataire"
                          color="error"
                          onClick={() => setDeleteTarget(tenant)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* FAB for mobile */}
      <Fab
        color="primary"
        aria-label="Ajouter un locataire"
        onClick={openCreate}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 32 },
          right: { xs: 16, sm: 32 },
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          {editingTenant ? 'Modifier le locataire' : 'Ajouter un locataire'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom complet *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              autoFocus
              error={!form.name.trim()}
              helperText={!form.name.trim() ? 'Le nom est requis' : ''}
            />
            <TextField
              label="Téléphone"
              value={form.phone ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Numéro de pièce d'identité"
              value={form.id_number ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, id_number: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Notes"
              value={form.notes ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isPending || !form.name.trim()}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
            sx={{ borderRadius: 2 }}
          >
            {editingTenant ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Supprimer le locataire ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>{deleteTarget?.name}</strong> ? Cette action est
            irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() =>
              deleteTarget && deleteMutation.mutate(deleteTarget.id)
            }
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={
              deleteMutation.isPending ? <CircularProgress size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <KhSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'success'}
        onClose={() => setSnackbar(null)}
        duration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
