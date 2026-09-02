'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  screeningService,
  type ScreeningDocumentType,
} from '@/services/screening.service';
import {
  CheckCircle as CheckCircleIcon,
  CloudUpload as UploadIcon,
  Description as DocIcon,
  ErrorOutline as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';

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

const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function formatDate(s: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function ScreeningPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const queryClient = useQueryClient();

  const [uploadingType, setUploadingType] =
    useState<ScreeningDocumentType | null>(null);
  const [submittedNow, setSubmittedNow] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const queryKey = ['public-screening', token];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      screeningService.getPublicScreening(token, { signal }),
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (vars: { document_type: ScreeningDocumentType; file: File }) =>
      screeningService.uploadDocument(token, vars),
    onMutate: (vars) => setUploadingType(vars.document_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSnackbar({ message: 'Document ajouté', severity: 'success' });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || "Échec de l'envoi du document",
        severity: 'error',
      });
    },
    onSettled: () => setUploadingType(null),
  });

  const submitMutation = useMutation({
    mutationFn: () => screeningService.submit(token),
    onSuccess: () => {
      setSubmittedNow(true);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || 'Échec de la soumission',
        severity: 'error',
      });
    },
  });

  function handleFileSelected(
    documentType: ScreeningDocumentType,
    fileList: FileList | null
  ): void {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setSnackbar({
        message: 'Fichier trop volumineux (10 Mo maximum).',
        severity: 'error',
      });
      return;
    }
    uploadMutation.mutate({ document_type: documentType, file });
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Lien invalide ou expiré
          </Typography>
          <Typography color="text.secondary">
            Ce lien de dossier n&apos;est pas valide ou a expiré. Contactez
            votre bailleur pour en obtenir un nouveau.
          </Typography>
        </Box>
      </Box>
    );
  }

  const screening = data;
  const expired =
    isExpired(screening.expires_at) || screening.status === 'expired';
  const isReviewed =
    screening.status === 'approved' || screening.status === 'rejected';
  const isSubmitted = submittedNow || screening.status === 'submitted';
  const uploadedTypes = new Set(
    screening.documents.map((d) => d.document_type)
  );
  const required = screening.required_documents ?? [];
  const uploadedCount = required.filter((t) => uploadedTypes.has(t)).length;
  const canSubmit = screening.documents.length > 0 && !uploadMutation.isPending;
  const isDone = expired || isReviewed || isSubmitted;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h5" fontWeight={800} color="primary" gutterBottom>
          KeyHome
        </Typography>
        <Typography variant="h6" fontWeight={600}>
          Votre dossier locataire
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bonjour <strong>{screening.tenant_name}</strong>, téléversez les
          documents demandés puis soumettez votre dossier.
        </Typography>
      </Box>

      {isDone ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {isSubmitted && !isReviewed && !expired ? (
            <>
              <CheckCircleIcon
                sx={{ fontSize: 72, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Dossier soumis
              </Typography>
              <Typography color="text.secondary">
                Votre dossier a bien été transmis à votre bailleur. Vous serez
                informé de sa décision.
              </Typography>
            </>
          ) : screening.status === 'approved' ? (
            <>
              <CheckCircleIcon
                sx={{ fontSize: 72, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Dossier approuvé
              </Typography>
              <Typography color="text.secondary">
                Votre bailleur a approuvé votre dossier.
              </Typography>
            </>
          ) : screening.status === 'rejected' ? (
            <>
              <ErrorIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Dossier refusé
              </Typography>
              <Typography color="text.secondary">
                Votre bailleur n&apos;a pas retenu votre dossier. Contactez-le
                pour plus d&apos;informations.
              </Typography>
            </>
          ) : (
            <>
              <ScheduleIcon
                sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Lien expiré
              </Typography>
              <Typography color="text.secondary">
                Ce lien a expiré. Contactez votre bailleur pour en obtenir un
                nouveau.
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <Stack spacing={3}>
          {screening.landlord_notes ? (
            <AppAlert severity="info" message={screening.landlord_notes} />
          ) : null}

          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DocIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Documents demandés
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {uploadedCount}/{required.length} fournis
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Stack divider={<Divider flexItem />}>
                {required.map((docType) => {
                  const done = uploadedTypes.has(docType);
                  const busy =
                    uploadingType === docType && uploadMutation.isPending;
                  return (
                    <Stack
                      key={docType}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ py: 1.5 }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ minWidth: 0 }}
                      >
                        {done ? (
                          <CheckCircleIcon
                            sx={{ color: 'success.main', fontSize: 20 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: '2px solid',
                              borderColor: 'divider',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={done ? 600 : 400}
                          noWrap
                        >
                          {DOC_TYPE_LABELS[docType]}
                        </Typography>
                      </Stack>
                      <Button
                        component="label"
                        size="small"
                        variant={done ? 'text' : 'outlined'}
                        disabled={uploadMutation.isPending}
                        startIcon={
                          busy ? (
                            <ButtonSpinner size={16} />
                          ) : (
                            <UploadIcon fontSize="small" />
                          )
                        }
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          flexShrink: 0,
                        }}
                      >
                        {done ? 'Remplacer' : 'Ajouter'}
                        <input
                          type="file"
                          hidden
                          accept={ACCEPT}
                          onChange={(e) => {
                            handleFileSelected(docType, e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {screening.documents.length > 0 ? (
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {screening.documents.map((d) => (
                <Chip
                  key={d.id}
                  label={d.original_name}
                  size="small"
                  variant="outlined"
                  sx={{ maxWidth: '100%' }}
                />
              ))}
            </Stack>
          ) : null}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', display: 'block' }}
          >
            Formats acceptés : JPG, PNG, WEBP, PDF · 10 Mo maximum par fichier.
            Ce lien expire le {formatDate(screening.expires_at)}.
          </Typography>

          <Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit || submitMutation.isPending}
              startIcon={
                submitMutation.isPending ? (
                  <ButtonSpinner size={16} />
                ) : (
                  <CheckCircleIcon />
                )
              }
              onClick={() => submitMutation.mutate()}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                textTransform: 'none',
                py: 1.5,
              }}
            >
              {submitMutation.isPending ? 'Envoi…' : 'Soumettre mon dossier'}
            </Button>
            {screening.documents.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 1 }}
              >
                Ajoutez au moins un document pour pouvoir soumettre.
              </Typography>
            ) : null}
          </Box>
        </Stack>
      )}

      <KhSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'success'}
        onClose={() => setSnackbar(null)}
        duration={4000}
      />
    </Container>
  );
}
