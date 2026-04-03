'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { AdFormValues } from '@/components/owner/AdForm';
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  LinearProgress,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  BookmarkAdded,
  CalendarMonth,
  CheckCircle,
  Description,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AdForm, { type TourScene } from '@/components/owner/AdForm';
import { adsService } from '@/services/ads.service';

function useProfileCompleteness(user: ReturnType<typeof useAuth>['user']) {
  const steps = [
    {
      key: 'name',
      label: 'Prénom & Nom',
      done: !!(user?.firstname && user?.lastname),
      icon: <Person sx={{ fontSize: 20 }} />,
    },
    {
      key: 'phone',
      label: 'Numéro de téléphone',
      done: !!user?.phone_number,
      icon: <Phone sx={{ fontSize: 20 }} />,
    },
    {
      key: 'city',
      label: 'Ville de résidence',
      done: !!user?.city_id,
      icon: <LocationOn sx={{ fontSize: 20 }} />,
    },
    {
      key: 'bio',
      label: 'Bio publique',
      done: !!user?.bio?.trim(),
      icon: <Description sx={{ fontSize: 20 }} />,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const isComplete = doneCount === steps.length;
  const progress = Math.round((doneCount / steps.length) * 100);
  return { steps, isComplete, progress, doneCount };
}

export default function OwnerNewAdPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [profileIncompleteDialogOpen, setProfileIncompleteDialogOpen] =
    useState(false);
  const { steps, isComplete, progress } = useProfileCompleteness(user);

  // QW11: draft restore — check for a saved auto-save on first render
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredDraft, setRestoredDraft] =
    useState<Partial<AdFormValues> | null>(null);
  const { hasDraft, restoreDraft, clearDraft } = useAutoSave<
    Partial<AdFormValues>
  >({
    key: 'ad-new',
    data: {} as Partial<AdFormValues>, // placeholder — AdForm manages the live data
    enabled: false, // disable auto-save here; AdForm does it internally
  });
  const draftCheckedRef = useRef(false);

  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    if (hasDraft) {
      setShowRestorePrompt(true);
    }
  }, [hasDraft]);

  const createMutation = useMutation({
    mutationFn: async ({
      values,
      images,
      tourScenes,
      propertyConditionPdf,
      idempotencyKey,
    }: {
      values: AdFormValues;
      images: File[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
      idempotencyKey?: string;
    }) => {
      const formData = new FormData();
      if (idempotencyKey) formData.append('_idempotency_key', idempotencyKey);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('adresse', values.adresse);
      formData.append('price', values.price);
      formData.append('surface_area', values.surface_area);
      formData.append('bedrooms', values.bedrooms);
      formData.append('bathrooms', values.bathrooms);
      formData.append('has_parking', values.has_parking ? '1' : '0');
      formData.append('latitude', String(values.latitude));
      formData.append('longitude', String(values.longitude));
      formData.append('quarter_id', values.quarter_id);
      formData.append('type_id', values.type_id);
      values.attributes.forEach((a) => formData.append('attributes[]', a));
      images.forEach((f, i) => formData.append(`images[${i}]`, f));

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
      if (values.charges_autres)
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

      if (values.is_boost_requested) {
        formData.append('is_boost_requested', '1');
      }

      const ad = await adsService.create(formData);

      // Upload tour scenes if any — clean up orphan ad on failure
      if (tourScenes && tourScenes.length > 0) {
        const validScenes = tourScenes.filter((s) => s.file && s.title.trim());
        if (validScenes.length > 0) {
          try {
            await adsService.uploadTourScenes(
              ad.id,
              validScenes.map((s) => ({
                title: s.title,
                image: s.file!,
                clientId: s.id,
                hotspots: s.hotspots?.map((h) => ({
                  pitch: h.pitch,
                  yaw: h.yaw,
                  target_scene: h.target_scene,
                  label: h.label,
                })),
              }))
            );
          } catch (scenesError) {
            // Roll back: delete the orphan ad so DB stays consistent
            await adsService.destroy(ad.id).catch(() => {});
            throw scenesError;
          }
        }
      }

      return ad;
    },
    onSuccess: () => {
      setScheduleDialogOpen(true);
    },
  });

  const handleSubmit = async (
    values: AdFormValues,
    images: File[],
    options?: {
      imagesToDelete?: number[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
      idempotencyKey?: string;
    }
  ) => {
    await createMutation.mutateAsync({
      values,
      images,
      tourScenes: options?.tourScenes,
      propertyConditionPdf: options?.propertyConditionPdf,
      idempotencyKey: options?.idempotencyKey,
    });
  };

  const handleEnhance = async (description: string) => {
    const { enhanced } = await adsService.enhanceDescription(description);
    return enhanced;
  };

  /**
   * Called by AdForm before the API call.
   * If the profile is incomplete, we force-save the current values as a draft,
   * open the "complete your profile" dialog, and return false to abort the submit.
   * The draft key matches what AdForm’s useAutoSave uses so it will be restored on return.
   */
  const handleBeforeSubmit = async (values: AdFormValues): Promise<boolean> => {
    if (!isComplete) {
      try {
        localStorage.setItem(
          'kh_autosave_ad-new',
          JSON.stringify({ data: values, ts: Date.now() })
        );
      } catch {
        // localStorage unavailable — best effort
      }
      setProfileIncompleteDialogOpen(true);
      return false;
    }
    return true;
  };

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Nouvelle annonce
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Suivez les étapes pour publier votre annonce rapidement.
        </Typography>
        <Box>
          <AdForm
            initialData={restoredDraft}
            onSubmit={handleSubmit}
            onBeforeSubmit={handleBeforeSubmit}
            onCancel={() => router.back()}
            submitLabel="Créer l'annonce"
            isSubmitting={createMutation.isPending}
            onEnhanceDescription={handleEnhance}
            stepperMode
          />
        </Box>
      </Container>

      {/* QW11: draft restore prompt */}
      <Snackbar
        open={showRestorePrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
        message="📝 Un brouillon sauvegardé a été trouvé"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              color="inherit"
              sx={{ fontWeight: 700 }}
              onClick={() => {
                const draft = restoreDraft();
                if (draft) setRestoredDraft(draft);
                setShowRestorePrompt(false);
              }}
            >
              Restaurer
            </Button>
            <Button
              size="small"
              color="inherit"
              sx={{ opacity: 0.7 }}
              onClick={() => {
                clearDraft();
                setShowRestorePrompt(false);
              }}
            >
              Ignorer
            </Button>
          </Box>
        }
      />

      {/* ─── Profile incomplete → draft saved dialog ─────────────────────── */}
      <Dialog
        open={profileIncompleteDialogOpen}
        onClose={() => setProfileIncompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', p: 0 } }}
      >
        {/* Teal gradient header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            px: 3,
            py: 3,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}
          >
            <BookmarkAdded
              sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 28 }}
            />
            <Typography variant="h6" fontWeight={700} color="white">
              Annonce sauvegardée en brouillon
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.82)', ml: 0.5 }}
          >
            Complétez votre profil pour la publier.
          </Typography>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Votre annonce a été automatiquement sauvegardée en tant que
            brouillon. Complétez les informations manquantes, puis revenez sur
            ce formulaire pour finaliser la publication — tout sera restauré.
          </Typography>

          {/* Progress */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.75,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              Profil complété
            </Typography>
            <Typography variant="caption" fontWeight={700} color="#0d9488">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 4,
              mb: 2.5,
              '& .MuiLinearProgress-bar': { bgcolor: '#0d9488' },
            }}
          />

          {/* Steps */}
          <Stack spacing={1.25}>
            {steps.map((step) => (
              <Box
                key={step.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: step.done ? 'success.light' : 'warning.light',
                  bgcolor: step.done
                    ? 'rgba(34,197,94,0.04)'
                    : (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(245,158,11,0.07)'
                          : 'rgba(245,158,11,0.05)',
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    bgcolor: step.done
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(245,158,11,0.12)',
                    color: step.done ? 'success.main' : 'warning.main',
                  }}
                >
                  {step.done ? (
                    <CheckCircle sx={{ fontSize: 18 }} />
                  ) : (
                    step.icon
                  )}
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    flex: 1,
                    color: step.done ? 'text.disabled' : 'text.primary',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}
                >
                  {step.label}
                </Typography>
                {!step.done && (
                  <Chip
                    label="Requis"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(245,158,11,0.12)',
                      color: 'warning.dark',
                      border: '1px solid',
                      borderColor: 'warning.light',
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0.5, gap: 1 }}>
          <Button
            variant="text"
            onClick={() => setProfileIncompleteDialogOpen(false)}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              borderRadius: 2,
            }}
          >
            Continuer à remplir
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => {
              setProfileIncompleteDialogOpen(false);
              router.push('/owner/profile');
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            Compléter mon profil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post-creation: configure schedules dialog */}
      <Dialog
        open={scheduleDialogOpen}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          🎉 Annonce créée avec succès !
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              mb: 2,
              bgcolor: (t) =>
                t.palette.mode === 'dark'
                  ? 'rgba(59,130,246,0.08)'
                  : 'rgba(59,130,246,0.06)',
              border: '1px solid',
              borderColor: 'rgba(59,130,246,0.2)',
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <CalendarMonth
              sx={{ fontSize: 22, color: '#3B82F6', mt: 0.2, flexShrink: 0 }}
            />
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                Configurez vos horaires de disponibilité
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Indiquez vos créneaux libres pour que les locataires puissent
                planifier une visite directement depuis votre annonce.
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Vous pouvez aussi ignorer cette étape et le faire plus tard depuis
            votre tableau de bord.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => router.push('/owner/ads')}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Ignorer
          </Button>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForward />}
            onClick={() => router.push('/owner/availability')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Configurer les horaires
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
