'use client';

import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  ownerScreeningService,
  type CreateScreeningPayload,
  type ScreeningDocumentType,
  type ScreeningRequest,
} from '@/services/owner/owner-screening.service';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Description as DocIcon,
  FactCheck as ReviewIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import ScreeningStatusChip from './ScreeningStatusChip';

interface ScreeningSectionProps {
  leaseContractId: string;
  tenantName?: string;
  tenantEmail?: string;
}

const DOC_TYPE_LABELS: Record<ScreeningDocumentType, string> = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  salary_slip: 'Bulletin de salaire',
  employer_letter: 'Attestation employeur',
  bank_statement: 'Relevé bancaire',
  tax_notice: "Avis d'imposition",
  proof_of_address: 'Justificatif de domicile',
  other: 'Autre',
};

const ALL_DOC_TYPES = Object.keys(DOC_TYPE_LABELS) as ScreeningDocumentType[];

export default function ScreeningSection({
  leaseContractId,
  tenantName = '',
  tenantEmail = '',
}: ScreeningSectionProps): ReactElement {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState<ScreeningRequest | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // ── Create form state ───────────────────────────────────────────
  const [formName, setFormName] = useState(tenantName);
  const [formEmail, setFormEmail] = useState(tenantEmail);
  const [formDocs, setFormDocs] = useState<ScreeningDocumentType[]>([
    'id_card',
    'salary_slip',
  ]);
  const [formNotes, setFormNotes] = useState('');
  const [formExpires, setFormExpires] = useState(14);

  // ── Review form state ───────────────────────────────────────────
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>(
    'approved'
  );
  const [reviewNotes, setReviewNotes] = useState('');

  const queryKey = ['owner-screening', leaseContractId];

  const { data: screenings, isLoading } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      ownerScreeningService.getScreeningRequests(leaseContractId, { signal }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateScreeningPayload) =>
      ownerScreeningService.createScreeningRequest(leaseContractId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSnackbar({ message: 'Demande de dossier créée', severity: 'success' });
      setShowCreate(false);
      resetCreateForm();
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || 'Erreur lors de la création',
        severity: 'error',
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      notes: string;
    }) =>
      ownerScreeningService.reviewScreeningRequest(leaseContractId, id, {
        decision,
        review_notes: notes || undefined,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey });
      setSnackbar({
        message:
          vars.decision === 'approved' ? 'Dossier approuvé' : 'Dossier rejeté',
        severity: 'success',
      });
      setShowReview(null);
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || "Erreur lors de l'évaluation",
        severity: 'error',
      });
    },
  });

  function resetCreateForm(): void {
    setFormName(tenantName);
    setFormEmail(tenantEmail);
    setFormDocs(['id_card', 'salary_slip']);
    setFormNotes('');
    setFormExpires(14);
  }

  function copyLink(url: string): void {
    navigator.clipboard.writeText(url);
    setSnackbar({ message: 'Lien copié', severity: 'success' });
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <DocIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Dossier locataire
            </Typography>
          </Stack>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCreate(true)}
            sx={{ borderRadius: 2 }}
          >
            Demander
          </Button>
        </Stack>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!isLoading && (!screenings || screenings.length === 0) && (
          <Typography variant="body2" color="text.secondary">
            Aucune demande de dossier pour ce bail.
          </Typography>
        )}

        {screenings && screenings.length > 0 && (
          <Stack spacing={1.5}>
            {screenings.map((s) => (
              <Card
                key={s.id}
                variant="outlined"
                sx={{ borderRadius: 2, p: 1.5 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {s.tenant_name}
                      </Typography>
                      <ScreeningStatusChip
                        status={s.status}
                        label={s.status_label}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {s.tenant_email} &middot; Expire le{' '}
                      {new Date(s.expires_at).toLocaleDateString('fr-FR')}
                    </Typography>
                    {s.documents.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {s.documents.map((d) => (
                          <Chip
                            key={d.id}
                            label={d.document_type_label}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Copier le lien">
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 0, borderRadius: 2 }}
                        onClick={() => copyLink(s.screening_url)}
                      >
                        <CopyIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    {s.status === 'submitted' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ReviewIcon fontSize="small" />}
                        onClick={() => {
                          setShowReview(s);
                          setReviewDecision('approved');
                          setReviewNotes('');
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        Évaluer
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onClose={() => !createMutation.isPending && setShowCreate(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          Demander un dossier au locataire
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom du locataire *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Email du locataire *"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Documents requis *</InputLabel>
              <Select
                multiple
                value={formDocs}
                onChange={(e) =>
                  setFormDocs(e.target.value as ScreeningDocumentType[])
                }
                label="Documents requis *"
                renderValue={(selected) =>
                  selected.map((v) => DOC_TYPE_LABELS[v]).join(', ')
                }
              >
                {ALL_DOC_TYPES.map((dt) => (
                  <MenuItem key={dt} value={dt}>
                    {DOC_TYPE_LABELS[dt]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Notes pour le locataire"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Ex. Merci de fournir les 3 derniers bulletins de salaire."
            />
            <TextField
              label="Expire dans (jours)"
              type="number"
              value={formExpires}
              onChange={(e) =>
                setFormExpires(
                  Math.max(1, Math.min(90, Number(e.target.value)))
                )
              }
              fullWidth
              inputProps={{ min: 1, max: 90 }}
              helperText="Le locataire aura ce nombre de jours pour soumettre."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setShowCreate(false)}
            variant="outlined"
            disabled={createMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() =>
              createMutation.mutate({
                tenant_name: formName,
                tenant_email: formEmail,
                required_documents: formDocs,
                landlord_notes: formNotes || undefined,
                expires_in_days: formExpires,
              })
            }
            variant="contained"
            disabled={
              createMutation.isPending ||
              !formName.trim() ||
              !formEmail.trim() ||
              formDocs.length === 0
            }
            startIcon={
              createMutation.isPending ? <ButtonSpinner size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Envoyer la demande
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={Boolean(showReview)}
        onClose={() => !reviewMutation.isPending && setShowReview(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          Évaluer le dossier de {showReview?.tenant_name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {showReview?.documents && showReview.documents.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Documents soumis :
                </Typography>
                {showReview.documents.map((d) => (
                  <Stack
                    key={d.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Chip
                      label={d.document_type_label}
                      size="small"
                      color="info"
                    />
                    <Typography
                      variant="caption"
                      component="a"
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'underline' }}
                    >
                      {d.original_name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
            <FormControl fullWidth>
              <InputLabel>Décision *</InputLabel>
              <Select
                value={reviewDecision}
                onChange={(e) =>
                  setReviewDecision(e.target.value as 'approved' | 'rejected')
                }
                label="Décision *"
              >
                <MenuItem value="approved">Approuver</MenuItem>
                <MenuItem value="rejected">Rejeter</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Ex. Dossier complet et conforme."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setShowReview(null)}
            variant="outlined"
            disabled={reviewMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (!showReview) return;
              reviewMutation.mutate({
                id: showReview.id,
                decision: reviewDecision,
                notes: reviewNotes,
              });
            }}
            variant="contained"
            color={reviewDecision === 'rejected' ? 'error' : 'primary'}
            disabled={reviewMutation.isPending}
            startIcon={
              reviewMutation.isPending ? <ButtonSpinner size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            {reviewDecision === 'approved' ? 'Approuver' : 'Rejeter'}
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
    </Card>
  );
}
