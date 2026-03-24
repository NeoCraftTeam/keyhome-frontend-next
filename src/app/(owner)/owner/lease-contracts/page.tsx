'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { ownerService, type LeaseContract, type SignatureRequest } from '@/services/owner.service';
import {
  AutoAwesome as AiIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Draw as DrawIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

export default function OwnerLeaseContractsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewContract, setViewContract] = useState<LeaseContract | null>(null);
  const [editContract, setEditContract] = useState<LeaseContract | null>(null);
  const [editForm, setEditForm] = useState({
    tenant_name: '',
    tenant_phone: '',
    tenant_email: '',
    tenant_id_number: '',
    unit_reference: '',
    special_conditions: '',
  });
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [enhancingConditions, setEnhancingConditions] = useState(false);
  const [signatureContract, setSignatureContract] = useState<LeaseContract | null>(null);
  const [signatureForm, setSignatureForm] = useState({ signer_email: '', signer_name: '' });
  const [expandedSignatureIds, setExpandedSignatureIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['owner-lease-contracts', page],
    queryFn: () => ownerService.getLeaseContracts({ page, per_page: 10 }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      ownerService.updateLeaseContract(editContract!.id, {
        tenant_name: editForm.tenant_name,
        tenant_phone: editForm.tenant_phone,
        tenant_email: editForm.tenant_email || null,
        tenant_id_number: editForm.tenant_id_number || null,
        unit_reference: editForm.unit_reference || null,
        special_conditions: editForm.special_conditions || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-lease-contracts'] });
      setEditContract(null);
      setSnackbar({ message: 'Contrat mis à jour avec succès', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ message: 'Erreur lors de la mise à jour', severity: 'error' });
    },
  });

  const createSignMutation = useMutation({
    mutationFn: () =>
      ownerService.createSignatureRequest(signatureContract!.id, {
        signer_email: signatureForm.signer_email,
        signer_name: signatureForm.signer_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-signatures', signatureContract!.id] });
      setSignatureContract(null);
      setSignatureForm({ signer_email: '', signer_name: '' });
      setSnackbar({ message: 'Demande de signature envoyée par email', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ message: "Erreur lors de l'envoi de la demande", severity: 'error' });
    },
  });

  const toggleSignatureExpand = (id: string) => {
    setExpandedSignatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const contracts = (data?.data ?? []) as LeaseContract[];
  const meta = data?.meta;

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const blob = await ownerService.downloadLeaseContract(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrat-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const openEdit = (c: LeaseContract) => {
    setEditForm({
      tenant_name: c.tenant_name,
      tenant_phone: c.tenant_phone,
      tenant_email: c.tenant_email ?? '',
      tenant_id_number: c.tenant_id_number ?? '',
      unit_reference: c.unit_reference ?? '',
      special_conditions: c.special_conditions ?? '',
    });
    setEditContract(c);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/owner/dashboard' },
          { label: 'Contrats de bail' },
        ]}
      />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Contrats de bail
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Liste de vos contrats générés. Les contrats sont créés depuis une annonce.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : contracts.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '1px dashed', borderColor: 'divider', p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun contrat
          </Typography>
          <Typography color="text.secondary">
            Générez un contrat de bail depuis l&apos;une de vos annonces ( Disponible ou Réservé ).
          </Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {contracts.map((c) => (
              <Card
                key={c.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 3 },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={2}>
                    <Stack spacing={1}>
                      <Typography
                        component="p"
                        fontWeight={700}
                        sx={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          lineHeight: 1.4,
                          wordBreak: 'break-all',
                          m: 0,
                        }}
                      >
                        {c.contract_number}
                      </Typography>
                      <Tooltip title={c.ad?.title || '—'} arrow>
                        <Chip
                          label={c.ad?.title || '—'}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.75rem',
                            maxWidth: '100%',
                            height: 'auto',
                            minHeight: 28,
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              py: 0.5,
                              display: 'block',
                              textAlign: 'left',
                            },
                          }}
                        />
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary">
                        Locataire : <strong>{c.tenant_name}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(c.lease_start)} → {formatDate(c.lease_end)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {c.monthly_rent?.toLocaleString('fr-FR')} XAF / mois
                      </Typography>
                    </Stack>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      useFlexGap
                      sx={{
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => setViewContract(c)}
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none', flex: { sm: 1 } }}
                      >
                        Voir
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openEdit(c)}
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none', flex: { sm: 1 } }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(c.id)}
                        disabled={downloadingId === c.id}
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none', flex: { sm: 1 } }}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        startIcon={<DrawIcon />}
                        onClick={() => {
                          setSignatureForm({ signer_email: '', signer_name: '' });
                          setSignatureContract(c);
                        }}
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none', flex: { sm: 1 } }}
                      >
                        Signature
                      </Button>
                      <Tooltip title={expandedSignatureIds.has(c.id) ? 'Masquer statut' : 'Statut signature'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleSignatureExpand(c.id)}
                          sx={{
                            transform: expandedSignatureIds.has(c.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            alignSelf: { xs: 'flex-end', sm: 'auto' },
                          }}
                        >
                          <ExpandMoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Collapse in={expandedSignatureIds.has(c.id)} unmountOnExit>
                      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                          Statut de la signature électronique
                        </Typography>
                        <SignatureStatusSection contractId={c.id} />
                      </Box>
                    </Collapse>
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
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* ═══ View Contract Dialog ═══ */}
      <Dialog
        open={!!viewContract}
        onClose={() => setViewContract(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {viewContract?.contract_number}
          </Typography>
          <IconButton onClick={() => setViewContract(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {viewContract && (
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <InfoRow label="Bien" value={viewContract.ad?.title || '—'} />
              <InfoRow label="Locataire" value={viewContract.tenant_name} />
              <InfoRow label="Téléphone" value={viewContract.tenant_phone} />
              {viewContract.tenant_email && <InfoRow label="Email" value={viewContract.tenant_email} />}
              {viewContract.tenant_id_number && <InfoRow label="N° CNI / Passeport" value={viewContract.tenant_id_number} />}
              {viewContract.unit_reference && <InfoRow label="Référence logement" value={viewContract.unit_reference} />}
              <InfoRow label="Début du bail" value={formatDate(viewContract.lease_start)} />
              <InfoRow label="Fin du bail" value={formatDate(viewContract.lease_end)} />
              <InfoRow label="Durée" value={`${viewContract.lease_duration_months} mois`} />
              <InfoRow label="Loyer mensuel" value={`${viewContract.monthly_rent?.toLocaleString('fr-FR')} XAF`} />
              {viewContract.deposit_amount && (
                <InfoRow label="Caution" value={`${viewContract.deposit_amount.toLocaleString('fr-FR')} XAF`} />
              )}
              {viewContract.special_conditions && (
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Conditions particulières</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                    {viewContract.special_conditions}
                  </Typography>
                </Box>
              )}
              <InfoRow label="Créé le" value={viewContract.created_at ? formatDate(viewContract.created_at) : '—'} />
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              if (viewContract) openEdit(viewContract);
              setViewContract(null);
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => viewContract && handleDownload(viewContract.id)}
            disabled={!!downloadingId}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Télécharger le PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Edit Contract Dialog ═══ */}
      <Dialog
        open={!!editContract}
        onClose={() => setEditContract(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Modifier le contrat</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Vous pouvez modifier les informations du locataire et les conditions. Les dates et montants ne sont pas modifiables.
          </Typography>
          <TextField
            label="Nom du locataire"
            size="small"
            value={editForm.tenant_name}
            onChange={(e) => setEditForm((f) => ({ ...f, tenant_name: e.target.value }))}
          />
          <TextField
            label="Téléphone du locataire"
            size="small"
            value={editForm.tenant_phone}
            onChange={(e) => setEditForm((f) => ({ ...f, tenant_phone: e.target.value }))}
          />
          <TextField
            label="Email du locataire"
            size="small"
            type="email"
            value={editForm.tenant_email}
            onChange={(e) => setEditForm((f) => ({ ...f, tenant_email: e.target.value }))}
          />
          <TextField
            label="N° CNI / Passeport"
            size="small"
            value={editForm.tenant_id_number}
            onChange={(e) => setEditForm((f) => ({ ...f, tenant_id_number: e.target.value }))}
          />
          <TextField
            label="Référence du logement"
            size="small"
            value={editForm.unit_reference}
            onChange={(e) => setEditForm((f) => ({ ...f, unit_reference: e.target.value }))}
          />
          <TextField
            label="Conditions particulières"
            size="small"
            multiline
            rows={3}
            value={editForm.special_conditions}
            onChange={(e) => setEditForm((f) => ({ ...f, special_conditions: e.target.value }))}
          />
          {editForm.special_conditions.trim() && (
            <Button
              size="small"
              startIcon={enhancingConditions ? <CircularProgress size={16} /> : <AiIcon />}
              onClick={async () => {
                setEnhancingConditions(true);
                try {
                  const enhanced = await ownerService.enhanceLeaseConditions(editForm.special_conditions);
                  setEditForm((f) => ({ ...f, special_conditions: enhanced }));
                } finally {
                  setEnhancingConditions(false);
                }
              }}
              disabled={enhancingConditions}
              sx={{ textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}
            >
              Améliorer avec l&apos;IA
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditContract(null)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            variant="contained"
            disabled={updateMutation.isPending || !editForm.tenant_name || !editForm.tenant_phone}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Signature Request Dialog ═══ */}
      <Dialog
        open={!!signatureContract}
        onClose={() => setSignatureContract(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Demande de signature électronique</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Un email sera envoyé au signataire avec un lien sécurisé pour signer le contrat{' '}
            <strong>{signatureContract?.contract_number}</strong>.
          </Typography>
          <TextField
            label="Email du signataire"
            type="email"
            size="small"
            required
            value={signatureForm.signer_email}
            onChange={(e) => setSignatureForm((f) => ({ ...f, signer_email: e.target.value }))}
          />
          <TextField
            label="Nom du signataire"
            size="small"
            required
            value={signatureForm.signer_name}
            onChange={(e) => setSignatureForm((f) => ({ ...f, signer_name: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSignatureContract(null)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => createSignMutation.mutate()}
            variant="contained"
            disabled={
              createSignMutation.isPending ||
              !signatureForm.signer_email ||
              !signatureForm.signer_name
            }
            startIcon={<DrawIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {createSignMutation.isPending ? 'Envoi…' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>{value}</Typography>
    </Box>
  );
}

const SIG_STATUS_CHIP: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'default' }> = {
  pending: { label: 'En attente', color: 'warning' },
  viewed: { label: 'Lu', color: 'info' },
  signed: { label: 'Signé ✓', color: 'success' },
  declined: { label: 'Refusé ✗', color: 'error' },
};

function SignatureStatusSection({ contractId }: { contractId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['contract-signatures', contractId],
    queryFn: () => ownerService.getSignatureRequests(contractId),
  });

  const signatures = (data ?? []) as SignatureRequest[];

  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (signatures.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Aucune demande de signature envoyée.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {signatures.map((sig) => {
        const chipConfig = SIG_STATUS_CHIP[sig.status] ?? { label: sig.status, color: 'default' as const };
        return (
          <Box key={sig.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap display="block">
                {sig.signer_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {sig.signer_email}
              </Typography>
            </Box>
            <Chip
              label={chipConfig.label}
              color={chipConfig.color}
              size="small"
              sx={{ fontWeight: 700, flexShrink: 0 }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
