'use client';

import FadeIn from '@/components/ui/layout/FadeIn';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import { useAuth } from '@/providers/AuthProvider';
import { disputesService } from '@/services/disputes.service';
import type { DisputeEvidenceType, DisputeStatus } from '@/types';
import AccessTime from '@mui/icons-material/AccessTime';
import AttachFile from '@mui/icons-material/AttachFile';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CloudUpload from '@mui/icons-material/CloudUpload';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import Gavel from '@mui/icons-material/Gavel';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import RateReview from '@mui/icons-material/RateReview';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  MenuItem,
  Link as MuiLink,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<
  DisputeStatus,
  {
    label: string;
    color: 'success' | 'error' | 'warning' | 'default' | 'info';
    icon: React.ReactElement;
  }
> = {
  open: {
    label: 'Ouvert',
    color: 'info',
    icon: <AccessTime sx={{ fontSize: 16 }} />,
  },
  under_review: {
    label: 'En examen',
    color: 'warning',
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
  },
  mediation: {
    label: 'Médiation',
    color: 'warning',
    icon: <RateReview sx={{ fontSize: 16 }} />,
  },
  resolved_initiator: {
    label: 'Résolu (initiateur)',
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
  },
  resolved_respondent: {
    label: 'Résolu (défendeur)',
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
  },
  resolved_amicably: {
    label: "Résolu à l'amiable",
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
  },
  rejected: {
    label: 'Rejeté',
    color: 'error',
    icon: <ErrorOutline sx={{ fontSize: 16 }} />,
  },
};

const STATUS_STEPS: DisputeStatus[] = ['open', 'under_review', 'mediation'];

function statusStepIndex(status: DisputeStatus): number {
  const idx = STATUS_STEPS.indexOf(status);
  if (idx >= 0) return idx;
  return STATUS_STEPS.length; // resolved/rejected = past last step
}

const EVIDENCE_TYPE_OPTIONS: { value: DisputeEvidenceType; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'document', label: 'Document' },
  { value: 'screenshot', label: "Capture d'écran" },
  { value: 'contract', label: 'Contrat' },
  { value: 'receipt', label: 'Reçu / facture' },
  { value: 'other', label: 'Autre' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [evidenceType, setEvidenceType] =
    useState<DisputeEvidenceType>('photo');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; ok: boolean } | null>(
    null
  );

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => disputesService.get(id),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      disputesService.uploadEvidence(id, evidenceFile!, evidenceType),
    onSuccess: () => {
      setSnackbar({ msg: 'Preuve ajoutée avec succès.', ok: true });
      setEvidenceFile(null);
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setSnackbar({
        msg: err?.response?.data?.message ?? "Erreur lors de l'upload.",
        ok: false,
      });
    },
  });

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 2, mb: 2 }}
        />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!dispute) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Litige introuvable.</Alert>
      </Container>
    );
  }

  const isInitiator = dispute.initiator.id === user?.id;
  const otherParty = isInitiator ? dispute.respondent : dispute.initiator;
  const statusCfg = STATUS_META[dispute.status] ?? STATUS_META.open;
  const evidences = dispute.evidences ?? [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Accueil', href: '/home' },
            { label: 'Mes litiges', href: '/litiges' },
            { label: dispute.reference },
          ]}
        />

        {/* ── Header ── */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {dispute.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {dispute.reference} · {dispute.type_label}
            </Typography>
          </Box>
          <Chip
            icon={statusCfg.icon}
            label={statusCfg.label}
            color={statusCfg.color}
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* ── Status stepper ── */}
        <Card
          sx={{
            borderRadius: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Stepper
              activeStep={statusStepIndex(dispute.status)}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
              }}
            >
              {STATUS_STEPS.map((s) => (
                <Step
                  key={s}
                  completed={
                    statusStepIndex(dispute.status) > STATUS_STEPS.indexOf(s)
                  }
                >
                  <StepLabel>{STATUS_META[s].label}</StepLabel>
                </Step>
              ))}
              <Step completed={dispute.is_resolved}>
                <StepLabel>
                  {dispute.is_resolved ? statusCfg.label : 'Résolution'}
                </StepLabel>
              </Step>
            </Stepper>

            {dispute.sla_deadline && dispute.is_open && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
              >
                Délai SLA :{' '}
                {new Date(dispute.sla_deadline).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* ── Info card ── */}
        <Card
          sx={{
            borderRadius: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}
                >
                  {dispute.description}
                </Typography>
              </Box>
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {isInitiator ? 'Partie adverse' : 'Initiateur'}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {otherParty.name}
                  </Typography>
                </Box>
                {dispute.amount_claimed != null &&
                  dispute.amount_claimed > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Montant réclamé
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {dispute.amount_claimed.toLocaleString('fr-FR')} FCFA
                      </Typography>
                    </Box>
                  )}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Ouvert le
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(dispute.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Stack>
              {dispute.resolution_note && (
                <>
                  <Divider />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Note de résolution
                    </Typography>
                    <Alert severity="info" sx={{ mt: 0.5, borderRadius: 1.5 }}>
                      {dispute.resolution_note}
                    </Alert>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* ── Preuves ── */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          Preuves ({evidences.length})
        </Typography>
        <Card
          sx={{
            borderRadius: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            {evidences.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center', fontSize: '0.9rem' }}
              >
                Aucune preuve déposée.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {evidences.map((ev) => (
                  <Stack
                    key={ev.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}
                    >
                      <InsertDriveFile sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <MuiLink
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        {ev.original_name}
                      </MuiLink>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {ev.type_label}
                        {ev.size_bytes
                          ? ` · ${(ev.size_bytes / 1024).toFixed(0)} Ko`
                          : ''}
                        {' · '}
                        {new Date(ev.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}

            {/* Upload form */}
            {dispute.is_open && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Ajouter une preuve
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems="flex-start"
                >
                  <Select
                    value={evidenceType}
                    onChange={(e) =>
                      setEvidenceType(e.target.value as DisputeEvidenceType)
                    }
                    size="small"
                    sx={{ minWidth: 160 }}
                  >
                    {EVIDENCE_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>

                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFile />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {evidenceFile
                      ? evidenceFile.name.slice(0, 30)
                      : 'Choisir un fichier'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf,.doc,.docx,.xlsx"
                      onChange={(e) =>
                        setEvidenceFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      uploadMutation.isPending ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <CloudUpload />
                      )
                    }
                    disabled={!evidenceFile || uploadMutation.isPending}
                    onClick={() => uploadMutation.mutate()}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Envoyer
                  </Button>
                </Stack>
                {uploadMutation.isPending && (
                  <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Closed banner */}
        {!dispute.is_open && (
          <Alert
            severity={dispute.status === 'rejected' ? 'error' : 'success'}
            icon={dispute.status === 'rejected' ? <ErrorOutline /> : <Gavel />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Ce litige est clos — {statusCfg.label.toLowerCase()}.
            {dispute.resolved_at &&
              ` Résolu le ${new Date(dispute.resolved_at).toLocaleDateString(
                'fr-FR',
                {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }
              )}.`}
          </Alert>
        )}
      </FadeIn>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.ok ? 'success' : 'error'}
          onClose={() => setSnackbar(null)}
          variant="filled"
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
