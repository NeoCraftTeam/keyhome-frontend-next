'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  CalendarMonth,
  CheckCircle,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AdForm, {
  type AdFormValues,
  type TourScene,
} from '@/components/owner/AdForm';
import { adsService } from '@/services/ads.service';
import { shadow } from '@/theme/tokens';

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
  const { steps, isComplete, progress } = useProfileCompleteness(user);

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

  if (!isComplete) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <Box
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: shadow.modal,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: { xs: 3, sm: 4 },
              py: 3,
              background: 'linear-gradient(135deg, #F6475F 0%, #ff7d8c 100%)',
            }}
          >
            <Typography
              variant="h5"
              fontWeight={800}
              color="white"
              gutterBottom
            >
              Complétez votre profil d&apos;abord
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Vos informations sont affichées aux clients une fois
              l&apos;annonce débloquée. Sans elles, ils ne peuvent pas vous
              contacter.
            </Typography>
          </Box>

          <Box sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
            {/* Progress */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
              >
                Progression du profil
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4, mb: 3 }}
            />

            {/* Steps */}
            <Stack spacing={1.5} sx={{ mb: 4 }}>
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
                    borderColor: step.done ? 'success.light' : 'divider',
                    bgcolor: step.done
                      ? 'rgba(34,197,94,0.05)'
                      : (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
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
                        : 'action.hover',
                      color: step.done ? 'success.main' : 'text.disabled',
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
                      color: step.done ? 'text.disabled' : 'text.primary',
                      textDecoration: step.done ? 'line-through' : 'none',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => router.push('/owner/profile')}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                py: 1.5,
              }}
            >
              Compléter mon profil
            </Button>
            <Button
              variant="text"
              fullWidth
              size="small"
              onClick={() => router.back()}
              sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary' }}
            >
              Retour
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

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
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            submitLabel="Créer l'annonce"
            isSubmitting={createMutation.isPending}
            onEnhanceDescription={handleEnhance}
            stepperMode
          />
        </Box>
      </Container>

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
