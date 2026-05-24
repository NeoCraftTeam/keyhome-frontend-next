'use client';

import AdFormWizard, {
  type AdFormValues,
  type TourScene,
} from '@/components/owner/AdFormWizard';
import PublishingOverlay from '@/components/owner/PublishingOverlay';
import {
  mapAdToFormValues,
  normalizeAdFormValues,
} from '@/components/owner/ad-form/types';
import FadeIn from '@/components/ui/FadeIn';
import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { adsService } from '@/services/ads.service';
import { ownerService } from '@/services/owner.service';
import { AdStatus } from '@/types';
import BackIcon from '@mui/icons-material/ArrowBack';
import AiIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import ContractIcon from '@mui/icons-material/Description';
import CalendarIcon from '@mui/icons-material/EventAvailable';
import OpenIcon from '@mui/icons-material/OpenInNew';
import UndoIcon from '@mui/icons-material/Undo';
import TourIcon from '@mui/icons-material/ViewInAr';
import VisibleIcon from '@mui/icons-material/Visibility';
import HiddenIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

export default function OwnerAdEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractPreviewOpen, setContractPreviewOpen] = useState(false);
  const [enhancingConditions, setEnhancingConditions] = useState(false);
  const [originalConditions, setOriginalConditions] = useState<string | null>(
    null
  );
  const [summarizingContract, setSummarizingContract] = useState(false);
  const [contractSummary, setContractSummary] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState({
    tenant_name: '',
    tenant_phone: '',
    tenant_email: '',
    tenant_id_number: '',
    unit_reference: '',
    lease_start: new Date().toISOString().slice(0, 10),
    lease_duration_months: 12,
    monthly_rent: '',
    deposit_amount: '',
    special_conditions: '',
  });

  const {
    data: ad,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsService.show(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      values,
      images,
      imagesToDelete,
      tourScenes,
      propertyConditionPdf,
    }: {
      values: AdFormValues;
      images: File[];
      imagesToDelete?: number[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
    }) => {
      // NOTE: _method=PUT is appended by adsService.update — do NOT add it here.
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('adresse', values.adresse);
      formData.append('price', values.price);
      if (values.transaction_type === 'location')
        formData.append('price_period', values.price_period);
      formData.append('surface_area', values.surface_area);
      formData.append('bedrooms', values.bedrooms);
      formData.append('bathrooms', values.bathrooms);
      formData.append('has_parking', values.has_parking ? '1' : '0');
      formData.append('latitude', String(values.latitude));
      formData.append('longitude', String(values.longitude));
      formData.append('quarter_id', values.quarter_id);
      formData.append('type_id', values.type_id);
      if (values.transaction_type)
        formData.append('transaction_type', values.transaction_type);
      values.attributes.forEach((a) => formData.append('attributes[]', a));
      images.forEach((f, i) => formData.append(`images[${i}]`, f));
      if (imagesToDelete?.length) {
        imagesToDelete.forEach((mid) =>
          formData.append('images_to_delete[]', String(mid))
        );
      }

      // Premium info
      if (values.deposit_amount)
        formData.append('deposit_amount', values.deposit_amount);
      if (values.minimum_lease_duration)
        formData.append(
          'minimum_lease_duration',
          values.minimum_lease_duration
        );
      formData.append(
        'charges_forfaitaires',
        values.charges_forfaitaires ? '1' : '0'
      );
      if (values.charges_forfaitaires && values.charges_montant_forfait) {
        formData.append(
          'charges_montant_forfait',
          values.charges_montant_forfait
        );
      }
      if (!values.charges_forfaitaires) {
        if (values.charges_eau)
          formData.append('charges_eau', values.charges_eau);
        if (values.charges_electricite)
          formData.append('charges_electricite', values.charges_electricite);
      }
      const chargesAutresStr = (values.charges_autres_items ?? [])
        .filter((item) => item.label.trim() && item.amount.trim())
        .map(
          (item) =>
            `${item.label}: ${item.amount} FCFA/${item.period === 'monthly' ? 'mois' : 'an'}`
        )
        .join('\n');
      if (chargesAutresStr) formData.append('charges_autres', chargesAutresStr);
      else if (values.charges_autres)
        formData.append('charges_autres', values.charges_autres);

      // Proximity & distance fields
      if (values.distance_main_road_m)
        formData.append('distance_main_road_m', values.distance_main_road_m);
      if (values.distance_shops_m)
        formData.append('distance_shops_m', values.distance_shops_m);
      if (values.distance_transport_m)
        formData.append('distance_transport_m', values.distance_transport_m);
      if (values.distance_school_m)
        formData.append('distance_school_m', values.distance_school_m);
      if (values.distance_hospital_m)
        formData.append('distance_hospital_m', values.distance_hospital_m);

      // Property condition PDF
      if (propertyConditionPdf) {
        formData.append('property_condition', propertyConditionPdf);
      }

      const updatedAd = await adsService.update(id, formData);

      // Upload tour scenes if any new ones
      if (tourScenes && tourScenes.length > 0) {
        const newScenes = tourScenes.filter((s) => s.file && s.title.trim());
        if (newScenes.length > 0) {
          await adsService.uploadTourScenes(
            id,
            newScenes.map((s) => ({
              title: s.title,
              image: s.file!,
              hotspots: s.hotspots?.map((h) => ({
                pitch: h.pitch,
                yaw: h.yaw,
                target_scene: h.target_scene,
                label: h.label,
              })),
            }))
          );
        }

        // Update hotspots for existing scenes (those without a new file but with modified hotspots)
        const existingScenes = tourScenes.filter(
          (s) => s.id && !s.id.startsWith('new-') && !s.file
        );
        await Promise.allSettled(
          existingScenes
            .filter((s) => s.hotspots && s.hotspots.length > 0)
            .map((scene) =>
              adsService.updateHotspots(
                id,
                scene.id!,
                scene.hotspots.map((h) => ({
                  pitch: h.pitch,
                  yaw: h.yaw,
                  target_scene: h.target_scene,
                  label: h.label,
                }))
              )
            )
        );
      }

      return updatedAd;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setSnackbar({
        message: 'Annonce mise à jour avec succès',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Erreur lors de la mise à jour.'
        ),
        severity: 'error',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => adsService.toggleVisibility(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setSnackbar({
        message: data?.is_visible ? 'Annonce visible' : 'Annonce masquée',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de modifier la visibilité.'
        ),
        severity: 'error',
      });
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: (status: string) => adsService.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setSnackbar({ message: 'Statut mis à jour', severity: 'success' });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de mettre à jour le statut.'
        ),
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adsService.destroy(id),
    onSuccess: () => {
      router.push('/owner/ads');
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de supprimer cette annonce.'
        ),
        severity: 'error',
      });
    },
  });

  /** Publish a DRAFT ad → PENDING for admin review. */
  const publishDraftMutation = useMutation({
    mutationFn: () => adsService.publishDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      router.push('/owner/ads');
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Erreur lors de la publication.'
        ),
        severity: 'error',
      });
    },
  });

  /** Save changes to an existing draft without publishing. */
  const saveDraftMutation = useMutation({
    mutationFn: async ({
      values,
      images,
      imagesToDelete,
    }: {
      values: AdFormValues;
      images: File[];
      imagesToDelete?: number[];
    }) => {
      // NOTE: _method=PUT is appended by adsService.update — do NOT add it here.
      const formData = new FormData();
      formData.append('is_draft', '1');
      if (values.title) formData.append('title', values.title);
      if (values.description)
        formData.append('description', values.description);
      if (values.adresse) formData.append('adresse', values.adresse);
      if (values.price) formData.append('price', values.price);
      if (values.transaction_type === 'location')
        formData.append('price_period', values.price_period);
      if (values.surface_area)
        formData.append('surface_area', values.surface_area);
      if (values.bedrooms) formData.append('bedrooms', values.bedrooms);
      if (values.bathrooms) formData.append('bathrooms', values.bathrooms);
      formData.append('has_parking', values.has_parking ? '1' : '0');
      if (values.latitude) formData.append('latitude', String(values.latitude));
      if (values.longitude)
        formData.append('longitude', String(values.longitude));
      if (values.quarter_id) formData.append('quarter_id', values.quarter_id);
      if (values.type_id) formData.append('type_id', values.type_id);
      if (values.transaction_type)
        formData.append('transaction_type', values.transaction_type);
      values.attributes.forEach((a) => formData.append('attributes[]', a));
      images.forEach((f, i) => formData.append(`images[${i}]`, f));
      if (imagesToDelete?.length) {
        imagesToDelete.forEach((mid) =>
          formData.append('images_to_delete[]', String(mid))
        );
      }
      // Lease conditions & charges (Step 3 data — was silently dropped before this fix)
      if (values.deposit_amount)
        formData.append('deposit_amount', values.deposit_amount);
      if (values.minimum_lease_duration)
        formData.append(
          'minimum_lease_duration',
          values.minimum_lease_duration
        );
      formData.append(
        'charges_forfaitaires',
        values.charges_forfaitaires ? '1' : '0'
      );
      if (values.charges_forfaitaires && values.charges_montant_forfait)
        formData.append(
          'charges_montant_forfait',
          values.charges_montant_forfait
        );
      if (!values.charges_forfaitaires) {
        if (values.charges_eau)
          formData.append('charges_eau', values.charges_eau);
        if (values.charges_electricite)
          formData.append('charges_electricite', values.charges_electricite);
      }
      const chargesAutresStr = (values.charges_autres_items ?? [])
        .filter((item) => item.label.trim() && item.amount.trim())
        .map(
          (item) =>
            `${item.label}: ${item.amount} FCFA/${item.period === 'monthly' ? 'mois' : 'an'}`
        )
        .join('\n');
      if (chargesAutresStr) formData.append('charges_autres', chargesAutresStr);
      // Proximity distances
      if (values.distance_main_road_m)
        formData.append('distance_main_road_m', values.distance_main_road_m);
      if (values.distance_shops_m)
        formData.append('distance_shops_m', values.distance_shops_m);
      if (values.distance_transport_m)
        formData.append('distance_transport_m', values.distance_transport_m);
      if (values.distance_school_m)
        formData.append('distance_school_m', values.distance_school_m);
      if (values.distance_hospital_m)
        formData.append('distance_hospital_m', values.distance_hospital_m);
      return adsService.update(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setSnackbar({
        message: 'Brouillon mis à jour',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Erreur lors de la sauvegarde du brouillon.'
        ),
        severity: 'error',
      });
    },
  });

  /** Save current form fields into draft_payload without touching the live ad. */
  const saveEditDraftMutation = useMutation({
    mutationFn: (fields: Record<string, unknown>) =>
      adsService.saveEditDraft(
        id,
        fields as Partial<
          Record<string, string | number | boolean | string[] | null>
        >
      ),
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Erreur lors de la sauvegarde.'
        ),
        severity: 'error',
      });
    },
  });

  /** Promote draft_payload to the live ad. */
  const applyEditDraftMutation = useMutation({
    mutationFn: () => adsService.applyEditDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setSnackbar({
        message: 'Modifications appliquées avec succès.',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          "Erreur lors de l'application des modifications."
        ),
        severity: 'error',
      });
    },
  });

  /** Discard draft_payload without modifying the live ad. */
  const discardEditDraftMutation = useMutation({
    mutationFn: () => adsService.discardEditDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad', id] });
      setSnackbar({ message: 'Modifications annulées.', severity: 'success' });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(err, "Erreur lors de l'annulation."),
        severity: 'error',
      });
    },
  });

  const contractMutation = useMutation({
    mutationFn: () =>
      ownerService.generateLeaseContract(id, {
        tenant_name: contractForm.tenant_name,
        tenant_phone: contractForm.tenant_phone,
        tenant_email: contractForm.tenant_email || undefined,
        tenant_id_number: contractForm.tenant_id_number || undefined,
        unit_reference: contractForm.unit_reference || undefined,
        lease_start: contractForm.lease_start,
        lease_duration_months: contractForm.lease_duration_months,
        monthly_rent: contractForm.monthly_rent
          ? Number(contractForm.monthly_rent)
          : undefined,
        deposit_amount: contractForm.deposit_amount
          ? Number(contractForm.deposit_amount)
          : undefined,
        special_conditions: contractForm.special_conditions || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-lease-contracts'] });
      setContractOpen(false);
      setSnackbar({
        message: 'Contrat de bail généré avec succès',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getLaravelApiErrorMessage(
          err,
          'Erreur lors de la génération du contrat.'
        ),
        severity: 'error',
      });
    },
  });

  const handleSubmit = useCallback(
    async (
      values: AdFormValues,
      images: File[],
      options?: {
        imagesToDelete?: number[];
        tourScenes?: TourScene[];
        propertyConditionPdf?: File | null;
      }
    ) => {
      // Save the update first
      await updateMutation.mutateAsync({
        values,
        images,
        imagesToDelete: options?.imagesToDelete,
        tourScenes: options?.tourScenes,
        propertyConditionPdf: options?.propertyConditionPdf,
      });
      // If this is a draft, also publish it (DRAFT → PENDING)
      if (ad?.status === AdStatus.DRAFT) {
        await publishDraftMutation.mutateAsync();
      }
    },
    [updateMutation.mutateAsync, publishDraftMutation.mutateAsync, ad?.status]
  );

  const handleSaveDraft = useCallback(
    async (
      values: AdFormValues,
      images: File[],
      options?: { imagesToDelete?: number[] }
    ) => {
      await saveDraftMutation.mutateAsync({
        values,
        images,
        imagesToDelete: options?.imagesToDelete,
      });
    },
    [saveDraftMutation.mutateAsync]
  );

  const handleEnhance = useCallback(async (description: string) => {
    const { enhanced } = await adsService.enhanceDescription(description);
    return enhanced;
  }, []);

  const handleEnhanceTitle = useCallback(
    async (
      title: string,
      context: { type?: string; city?: string; transaction_type?: string }
    ) => {
      const { enhanced } = await adsService.enhanceTitle(title, context);
      return enhanced;
    },
    []
  );

  const handleGenerateDescription = useCallback(
    async (attributes: {
      type?: string;
      city?: string;
      quarter?: string;
      bedrooms?: number;
      surface?: number;
      price?: number;
      transaction_type?: string;
    }) => {
      const { generated } =
        await adsService.generateDescriptionFromAttributes(attributes);
      return generated;
    },
    []
  );

  const initialData = useMemo((): AdFormValues => {
    if (!ad) {
      return normalizeAdFormValues();
    }

    return mapAdToFormValues(ad);
  }, [ad]);

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton
          variant="rectangular"
          height={60}
          sx={{ borderRadius: 2, mb: 3 }}
        />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  /* ─── Error ─── */
  if (error || !ad) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => router.push('/owner/ads')}
            >
              Retour
            </Button>
          }
        >
          Annonce introuvable ou erreur de chargement.
        </Alert>
      </Container>
    );
  }

  const isDraft = ad.status === AdStatus.DRAFT;

  const statusColor =
    ad.status === AdStatus.AVAILABLE
      ? 'success'
      : ad.status === AdStatus.RESERVED || ad.status === AdStatus.PENDING
        ? 'warning'
        : ad.status === AdStatus.DECLINED
          ? 'error'
          : ad.status === AdStatus.DRAFT
            ? 'secondary'
            : 'default';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* ═══ Header ═══ */}
      <FadeIn>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/owner/ads')}
            sx={{
              mb: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Retour aux annonces
          </Button>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                gutterBottom
                sx={{ lineHeight: 1.2 }}
              >
                Modifier l&apos;annonce
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.75,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  label={ad.status_label || ad.status}
                  size="small"
                  color={
                    statusColor as
                      | 'default'
                      | 'primary'
                      | 'secondary'
                      | 'error'
                      | 'info'
                      | 'success'
                      | 'warning'
                  }
                  sx={{ fontWeight: 700 }}
                />
                {ad.is_visible === false && (
                  <Chip
                    label="Masqué"
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {ad.has_3d_tour && (
                  <Chip
                    icon={<TourIcon sx={{ fontSize: 16 }} />}
                    label={`Tour 3D · ${ad.tour_scenes_count ?? '?'} scènes`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {ad.view_count != null && ad.view_count > 0 && (
                  <Chip
                    label={`${ad.view_count} vues`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <ButtonGroup
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiButton-root': {
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  },
                }}
              >
                <Button
                  startIcon={
                    ad.is_visible !== false ? <HiddenIcon /> : <VisibleIcon />
                  }
                  onClick={() => toggleMutation.mutate()}
                  disabled={toggleMutation.isPending}
                >
                  {ad.is_visible !== false ? 'Masquer' : 'Afficher'}
                </Button>
                {ad.status !== AdStatus.PENDING &&
                  ad.status !== AdStatus.DECLINED && (
                    <>
                      {ad.status !== AdStatus.RESERVED && (
                        <Button
                          onClick={() =>
                            setStatusMutation.mutate(AdStatus.RESERVED)
                          }
                          disabled={setStatusMutation.isPending}
                        >
                          Réservé
                        </Button>
                      )}
                      {ad.status !== AdStatus.AVAILABLE && (
                        <Button
                          onClick={() =>
                            setStatusMutation.mutate(AdStatus.AVAILABLE)
                          }
                          disabled={setStatusMutation.isPending}
                        >
                          Disponible
                        </Button>
                      )}
                    </>
                  )}
              </ButtonGroup>
              {isDraft && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => publishDraftMutation.mutate()}
                  disabled={publishDraftMutation.isPending}
                  startIcon={
                    publishDraftMutation.isPending ? (
                      <CircularProgress size={16} />
                    ) : null
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  Publier l&apos;annonce
                </Button>
              )}
              {(ad.status === AdStatus.AVAILABLE ||
                ad.status === AdStatus.RESERVED) && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<ContractIcon />}
                  onClick={() => {
                    setContractForm((prev) => ({
                      ...prev,
                      monthly_rent: ad.price != null ? String(ad.price) : '',
                      deposit_amount: ad.deposit_amount
                        ? String(ad.deposit_amount)
                        : ad.price != null
                          ? String(ad.price)
                          : '',
                    }));
                    setContractOpen(true);
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Générer un contrat
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<CalendarIcon />}
                onClick={() => router.push(`/owner/availability?adId=${id}`)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Créneaux de visite
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteOpen(true)}
                disabled={deleteMutation.isPending}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Supprimer
              </Button>
            </Box>
          </Box>
        </Box>
      </FadeIn>

      {/* ═══ Success/Error feedback ═══ */}
      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          Annonce mise à jour avec succès.
          <Button
            size="small"
            startIcon={<OpenIcon />}
            onClick={() => {
              const slug =
                ad.slug || ad.title.toLowerCase().replace(/\s+/g, '-');
              window.open(
                `/ads/${ad.id}/${slug}`,
                '_blank',
                'noopener,noreferrer'
              );
            }}
            sx={{ ml: 1, textTransform: 'none' }}
          >
            Aperçu public (nouvel onglet)
          </Button>
        </Alert>
      )}

      {/* ═══ Draft Banner ═══ */}
      {isDraft && (
        <Alert
          severity="info"
          sx={{ borderRadius: 2, mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => publishDraftMutation.mutate()}
              disabled={publishDraftMutation.isPending}
              sx={{ fontWeight: 700 }}
            >
              Publier maintenant
            </Button>
          }
        >
          Cette annonce est un <strong>brouillon</strong>. Complétez les
          informations et publiez-la pour qu&apos;elle soit soumise à
          validation.
        </Alert>
      )}

      {/* ═══ Pending-edit Banner (non-DRAFT ads with unsaved changes) ═══ */}
      {!isDraft && ad.draft_payload && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 2, mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => applyEditDraftMutation.mutate()}
                disabled={
                  applyEditDraftMutation.isPending ||
                  discardEditDraftMutation.isPending
                }
                sx={{ fontWeight: 700 }}
              >
                Appliquer
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => discardEditDraftMutation.mutate()}
                disabled={
                  applyEditDraftMutation.isPending ||
                  discardEditDraftMutation.isPending
                }
              >
                Annuler
              </Button>
            </Box>
          }
        >
          Vous avez des <strong>modifications non publiées</strong>.
          Appliquez-les pour les rendre visibles, ou annulez pour revenir à la
          version actuelle.
        </Alert>
      )}

      {/* ═══ Form ═══ */}
      <AdFormWizard
        initialData={initialData}
        ad={ad}
        onSubmit={handleSubmit}
        onSaveDraft={isDraft ? handleSaveDraft : undefined}
        onCancel={() => router.push('/owner/ads')}
        submitLabel={
          isDraft ? "Publier l'annonce" : 'Enregistrer les modifications'
        }
        draftLabel="Mettre à jour le brouillon"
        isSubmitting={
          isDraft
            ? updateMutation.isPending || publishDraftMutation.isPending
            : updateMutation.isPending
        }
        isSavingDraft={saveDraftMutation.isPending}
        onEnhanceDescription={handleEnhance}
        onEnhanceTitle={handleEnhanceTitle}
        onGenerateDescription={handleGenerateDescription}
        editDraftMode={!isDraft}
        onSaveEditDraft={async (fields) => {
          await saveEditDraftMutation.mutateAsync(fields);
        }}
        onApplyEditDraft={async () => {
          await applyEditDraftMutation.mutateAsync();
        }}
        onDiscardEditDraft={async () => {
          await discardEditDraftMutation.mutateAsync();
        }}
        isApplyingEditDraft={
          applyEditDraftMutation.isPending || discardEditDraftMutation.isPending
        }
      />

      {/* ═══ Publishing overlay ═══ */}
      <PublishingOverlay
        open={
          isDraft &&
          (updateMutation.isPending || publishDraftMutation.isPending)
        }
        title="En cours de publication…"
        subtitle="Ne quittez pas cette page — votre annonce est en cours de soumission."
      />

      {/* ═══ Deletion overlay ═══ */}
      <PublishingOverlay
        open={deleteMutation.isPending}
        title="Suppression en cours…"
        subtitle="Ne quittez pas cette page — votre annonce est en cours de suppression."
        Icon={DeleteIcon}
        accentColor="#d32f2f"
      />

      {/* ═══ Delete Confirmation Dialog ═══ */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Supprimer cette annonce ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible. L&apos;annonce &quot;{ad.title}&quot;
            sera définitivement supprimée, ainsi que toutes les photos, le tour
            3D et les données associées.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              setDeleteOpen(false);
              deleteMutation.mutate();
            }}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Generate Lease Contract Dialog ═══ */}
      <Dialog
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Générer un contrat de bail</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '8px !important',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Les informations du bien &quot;{ad.title}&quot; seront
            automatiquement pré-remplies dans le contrat.
          </Typography>
          <TextField
            label="Nom du locataire"
            required
            size="small"
            value={contractForm.tenant_name}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, tenant_name: e.target.value }))
            }
          />
          <TextField
            label="Téléphone du locataire"
            required
            size="small"
            value={contractForm.tenant_phone}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, tenant_phone: e.target.value }))
            }
          />
          <TextField
            label="Email du locataire"
            size="small"
            type="email"
            value={contractForm.tenant_email}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, tenant_email: e.target.value }))
            }
          />
          <TextField
            label="N° CNI / Passeport"
            size="small"
            value={contractForm.tenant_id_number}
            onChange={(e) =>
              setContractForm((p) => ({
                ...p,
                tenant_id_number: e.target.value,
              }))
            }
          />
          <TextField
            label="Référence du logement"
            size="small"
            value={contractForm.unit_reference}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, unit_reference: e.target.value }))
            }
          />
          <TextField
            label="Date de début du bail"
            required
            size="small"
            type="date"
            value={contractForm.lease_start}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, lease_start: e.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl size="small" required>
            <InputLabel>Durée du bail</InputLabel>
            <Select
              value={contractForm.lease_duration_months}
              label="Durée du bail"
              onChange={(e) =>
                setContractForm((p) => ({
                  ...p,
                  lease_duration_months: Number(e.target.value),
                }))
              }
            >
              <MenuItem value={6}>6 mois</MenuItem>
              <MenuItem value={12}>12 mois (1 an)</MenuItem>
              <MenuItem value={24}>24 mois (2 ans)</MenuItem>
              <MenuItem value={36}>36 mois (3 ans)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Loyer mensuel (FCFA)"
            size="small"
            type="number"
            value={contractForm.monthly_rent}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, monthly_rent: e.target.value }))
            }
          />
          <TextField
            label="Caution (FCFA)"
            size="small"
            type="number"
            value={contractForm.deposit_amount}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, deposit_amount: e.target.value }))
            }
          />
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
              {[
                'Interdiction de sous-location',
                'Animaux domestiques autorisés',
                'Entretien jardin à la charge du locataire',
                'Préavis de 2 mois requis',
                'Loyer payable avant le 5 du mois',
                'État des lieux contradictoire obligatoire',
              ].map((clause) => (
                <Chip
                  key={clause}
                  label={clause}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() =>
                    setContractForm((p) => ({
                      ...p,
                      special_conditions: p.special_conditions
                        ? `${p.special_conditions}\n${clause}`
                        : clause,
                    }))
                  }
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
            <TextField
              label="Conditions particulières"
              size="small"
              multiline
              rows={3}
              fullWidth
              value={contractForm.special_conditions}
              onChange={(e) =>
                setContractForm((p) => ({
                  ...p,
                  special_conditions: e.target.value,
                }))
              }
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {contractForm.special_conditions.trim() && (
              <Button
                size="small"
                startIcon={
                  enhancingConditions ? (
                    <CircularProgress size={14} />
                  ) : (
                    <AiIcon />
                  )
                }
                onClick={async () => {
                  const prev = contractForm.special_conditions;
                  setEnhancingConditions(true);
                  try {
                    const enhanced = await ownerService.enhanceLeaseConditions(
                      contractForm.special_conditions
                    );
                    setOriginalConditions(prev);
                    setContractForm((p) => ({
                      ...p,
                      special_conditions: enhanced,
                    }));
                  } catch (err: unknown) {
                    setSnackbar({
                      message: getLaravelApiErrorMessage(
                        err,
                        "Impossible d'améliorer le texte avec l'IA."
                      ),
                      severity: 'error',
                    });
                  } finally {
                    setEnhancingConditions(false);
                  }
                }}
                disabled={enhancingConditions}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Améliorer avec l&apos;IA
              </Button>
            )}
            {originalConditions !== null && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  setContractForm((p) => ({
                    ...p,
                    special_conditions: originalConditions,
                  }));
                  setOriginalConditions(null);
                }}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Annuler
              </Button>
            )}
            <Button
              size="small"
              variant="text"
              startIcon={
                summarizingContract ? (
                  <CircularProgress size={14} />
                ) : (
                  <AiIcon />
                )
              }
              onClick={async () => {
                setSummarizingContract(true);
                setContractSummary(null);
                try {
                  const s = await ownerService.summarizeLeaseContract({
                    monthly_rent: contractForm.monthly_rent
                      ? Number(contractForm.monthly_rent)
                      : undefined,
                    deposit_amount: contractForm.deposit_amount
                      ? Number(contractForm.deposit_amount)
                      : undefined,
                    start_date: contractForm.lease_start || undefined,
                    duration_months:
                      contractForm.lease_duration_months || undefined,
                    special_conditions:
                      contractForm.special_conditions || undefined,
                  });
                  setContractSummary(s);
                } finally {
                  setSummarizingContract(false);
                }
              }}
              disabled={summarizingContract}
              sx={{ textTransform: 'none' }}
            >
              Résumé locataire
            </Button>
          </Box>
          {contractSummary && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                fontSize: '0.78rem',
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
              }}
            >
              {contractSummary}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setContractOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              setContractOpen(false);
              setContractPreviewOpen(true);
            }}
            variant="contained"
            disabled={!contractForm.tenant_name || !contractForm.tenant_phone}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Aperçu du contrat
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Contract Preview Dialog ═══ */}
      <Dialog
        open={contractPreviewOpen}
        onClose={() => setContractPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Aperçu du contrat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vérifiez les informations avant de générer le contrat PDF. Vous
            pourrez modifier si nécessaire.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Bien
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {ad.title}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Locataire
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {contractForm.tenant_name}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Téléphone
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {contractForm.tenant_phone}
              </Typography>
            </Box>
            {contractForm.tenant_email && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {contractForm.tenant_email}
                </Typography>
              </Box>
            )}
            {contractForm.tenant_id_number && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  N° CNI / Passeport
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {contractForm.tenant_id_number}
                </Typography>
              </Box>
            )}
            {contractForm.unit_reference && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Référence logement
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {contractForm.unit_reference}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Début du bail
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {new Date(contractForm.lease_start).toLocaleDateString(
                  'fr-FR',
                  { day: '2-digit', month: 'long', year: 'numeric' }
                )}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Durée
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {contractForm.lease_duration_months} mois
              </Typography>
            </Box>
            {contractForm.monthly_rent && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loyer mensuel
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Number(contractForm.monthly_rent).toLocaleString('fr-FR')}{' '}
                  FCFA
                </Typography>
              </Box>
            )}
            {contractForm.deposit_amount && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Caution
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Number(contractForm.deposit_amount).toLocaleString('fr-FR')}{' '}
                  FCFA
                </Typography>
              </Box>
            )}
            {contractForm.special_conditions && (
              <Box sx={{ py: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Conditions particulières
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    bgcolor: 'action.hover',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  {contractForm.special_conditions}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setContractPreviewOpen(false);
              setContractOpen(true);
            }}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Modifier
          </Button>
          <Button
            onClick={() => {
              setContractPreviewOpen(false);
              contractMutation.mutate();
            }}
            variant="contained"
            disabled={contractMutation.isPending}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {contractMutation.isPending
              ? 'Génération…'
              : 'Confirmer et générer le PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Snackbar ═══ */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
