'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { AdFormValues } from '@/components/owner/AdForm';
import MarkdownBioEditor from '@/components/owner/MarkdownBioEditor';
import PhoneField from '@/components/ui/PhoneField';
import { usersService } from '@/services/users.service';
import { citiesService } from '@/services/cities.service';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import {
  normalizePhoneLikeBackend,
  shouldSendPhoneNumberForUserUpdate,
} from '@/lib/profile-phone';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Drawer,
  LinearProgress,
  DialogTitle,
  Grid,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import BookmarkAdded from '@mui/icons-material/BookmarkAdded';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Close from '@mui/icons-material/Close';
import Description from '@mui/icons-material/Description';
import LocationOn from '@mui/icons-material/LocationOn';
import Person from '@mui/icons-material/Person';
import Phone from '@mui/icons-material/Phone';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdForm, { type TourScene } from '@/components/owner/AdForm';
import { adsService } from '@/services/ads.service';

const PROFILE_STEP_ICONS = {
  name: <Person sx={{ fontSize: 20 }} />,
  phone: <Phone sx={{ fontSize: 20 }} />,
  city: <LocationOn sx={{ fontSize: 20 }} />,
  bio: <Description sx={{ fontSize: 20 }} />,
};

function useProfileCompleteness(user: ReturnType<typeof useAuth>['user']) {
  const steps = useMemo(
    () => [
      {
        key: 'name',
        label: 'Prénom & Nom',
        done: !!(user?.firstname && user?.lastname),
        icon: PROFILE_STEP_ICONS.name,
      },
      {
        key: 'phone',
        label: 'Numéro de téléphone',
        done: !!user?.phone_number,
        icon: PROFILE_STEP_ICONS.phone,
      },
      {
        key: 'city',
        label: 'Ville de résidence',
        done: !!user?.city_id,
        icon: PROFILE_STEP_ICONS.city,
      },
      {
        key: 'bio',
        label: 'Bio publique',
        done: !!user?.bio?.trim(),
        icon: PROFILE_STEP_ICONS.bio,
      },
    ],
    [
      user?.firstname,
      user?.lastname,
      user?.phone_number,
      user?.city_id,
      user?.bio,
    ]
  );
  const doneCount = steps.filter((s) => s.done).length;
  const isComplete = doneCount === steps.length;
  const progress = Math.round((doneCount / steps.length) * 100);
  return { steps, isComplete, progress, doneCount };
}

/** Build FormData from ad form values + images. Pure utility — hoisted outside component. */
function buildAdFormData(
  values: AdFormValues,
  images: File[],
  options?: { idempotencyKey?: string }
): FormData {
  const formData = new FormData();
  if (options?.idempotencyKey)
    formData.append('_idempotency_key', options.idempotencyKey);
  if (values.title) formData.append('title', values.title);
  if (values.description) formData.append('description', values.description);
  if (values.adresse) formData.append('adresse', values.adresse);
  if (values.price) formData.append('price', values.price);
  if (values.surface_area) formData.append('surface_area', values.surface_area);
  if (values.bedrooms) formData.append('bedrooms', values.bedrooms);
  if (values.bathrooms) formData.append('bathrooms', values.bathrooms);
  formData.append('has_parking', values.has_parking ? '1' : '0');
  if (values.latitude) formData.append('latitude', String(values.latitude));
  if (values.longitude) formData.append('longitude', String(values.longitude));
  if (values.quarter_id) formData.append('quarter_id', values.quarter_id);
  if (values.type_id) formData.append('type_id', values.type_id);
  values.attributes.forEach((a) => formData.append('attributes[]', a));
  images.forEach((f, i) => formData.append(`images[${i}]`, f));
  if (values.deposit_amount)
    formData.append('deposit_amount', values.deposit_amount);
  if (values.minimum_lease_duration)
    formData.append('minimum_lease_duration', values.minimum_lease_duration);
  formData.append(
    'charges_forfaitaires',
    values.charges_forfaitaires ? '1' : '0'
  );
  if (values.charges_forfaitaires && values.charges_montant_forfait) {
    formData.append('charges_montant_forfait', values.charges_montant_forfait);
  }
  if (!values.charges_forfaitaires) {
    if (values.charges_eau) formData.append('charges_eau', values.charges_eau);
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
  if (values.is_boost_requested) {
    formData.append('is_boost_requested', '1');
  }
  return formData;
}

export default function OwnerNewAdPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'form' | 'profile'>('form');
  const { steps, isComplete, progress } = useProfileCompleteness(user);

  // Inline profile completion state
  const [profileForm, setProfileForm] = useState({
    firstname: user?.firstname ?? '',
    lastname: user?.lastname ?? '',
    phone_number: user?.phone_number ?? '',
    bio: user?.bio ?? '',
  });
  const [profileCity, setProfileCity] = useState<{
    id: string;
    name: string;
  } | null>(
    user?.city_id ? { id: user.city_id, name: user.city_name ?? '' } : null
  );
  const [profileCityInput, setProfileCityInput] = useState(
    user?.city_name ?? ''
  );
  const [debouncedProfileCityInput, setDebouncedProfileCityInput] =
    useState(profileCityInput);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedProfileCityInput(profileCityInput),
      300
    );
    return () => clearTimeout(timer);
  }, [profileCityInput]);

  const { data: profileCitiesData } = useQuery({
    queryKey: ['new-ad-profile-cities', debouncedProfileCityInput],
    queryFn: () => citiesService.list({ q: debouncedProfileCityInput }),
    enabled: debouncedProfileCityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });
  const profileCities = (profileCitiesData?.data ?? []) as {
    id: string;
    name: string;
  }[];
  const {
    slotProps: profileCitySlotProps,
    renderOption: renderProfileCityOption,
    inputSx: profileCityInputSx,
  } = useCityAutocompleteConfig();

  const handleSaveInlineProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      const formData = new FormData();
      formData.append('firstname', profileForm.firstname);
      formData.append('lastname', profileForm.lastname);
      if (shouldSendPhoneNumberForUserUpdate(profileForm.phone_number)) {
        formData.append(
          'phone_number',
          normalizePhoneLikeBackend(profileForm.phone_number)
        );
      }
      if (profileCity?.id) formData.append('city_id', profileCity.id);
      if (profileForm.bio) formData.append('bio', profileForm.bio);
      await usersService.update(user.id, formData);
      await refreshUser();
      setActivePanel('form');
    } catch {
      setProfileSaveError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // QW11: draft restore — check for a saved auto-save on first render
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredDraft, setRestoredDraft] =
    useState<Partial<AdFormValues> | null>(null);
  // formKey forces AdForm to remount with the restored draft as initialData
  const [formKey, setFormKey] = useState(0);
  const { hasDraft, restoreDraft, clearDraft } = useAutoSave<
    Partial<AdFormValues>
  >({
    key: 'ad-new',
    data: {} as Partial<AdFormValues>,
    enabled: false,
  });
  const draftCheckedRef = useRef(false);

  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    if (hasDraft) {
      setShowRestorePrompt(true);
    }
  }, [hasDraft]);

  // ── Draft mutation — save partial data to server ──
  const [draftSnackbar, setDraftSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const draftMutation = useMutation({
    mutationFn: async ({
      values,
      images,
    }: {
      values: AdFormValues;
      images: File[];
    }) => {
      const formData = buildAdFormData(values, images);
      return adsService.saveDraft(formData);
    },
    onSuccess: (ad) => {
      setDraftSnackbar({
        message: 'Brouillon enregistré sur le serveur.',
        severity: 'success',
      });
      // Redirect to edit page so further saves update the same ad
      router.push(`/owner/ads/${ad.id}`);
    },
    onError: () => {
      setDraftSnackbar({
        message: "Erreur lors de l'enregistrement du brouillon.",
        severity: 'error',
      });
    },
  });

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
      const formData = buildAdFormData(values, images, { idempotencyKey });

      // Property condition PDF
      if (propertyConditionPdf) {
        formData.append('property_condition', propertyConditionPdf);
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

  const handleSaveDraft = useCallback(
    async (values: AdFormValues, images: File[]) => {
      await draftMutation.mutateAsync({ values, images });
    },
    [draftMutation.mutateAsync]
  );

  const handleSubmit = useCallback(
    async (
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
    },
    [createMutation.mutateAsync]
  );

  const handleEnhance = useCallback(async (description: string) => {
    const { enhanced } = await adsService.enhanceDescription(description);
    return enhanced;
  }, []);

  /**
   * Called by AdForm before the API call.
   * If the profile is incomplete, we force-save the current values as a draft,
   * open the "complete your profile" dialog, and return false to abort the submit.
   * The draft key matches what AdForm’s useAutoSave uses so it will be restored on return.
   */
  const handleBeforeSubmit = useCallback(
    async (values: AdFormValues): Promise<boolean> => {
      if (!isComplete) {
        try {
          localStorage.setItem(
            'kh_autosave_ad-new',
            JSON.stringify({ data: values, ts: Date.now() })
          );
        } catch {
          // localStorage unavailable — best effort
        }
        setActivePanel('profile');
        return false;
      }
      return true;
    },
    [isComplete]
  );

  return (
    <>
      {/* Ad creation form — always mounted, never unmounts */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Nouvelle annonce
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Suivez les étapes pour publier votre annonce rapidement.
        </Typography>
        <AdForm
          key={formKey}
          initialData={restoredDraft}
          onSubmit={handleSubmit}
          onBeforeSubmit={handleBeforeSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={() => router.back()}
          submitLabel="Publier l'annonce"
          draftLabel="Enregistrer le brouillon"
          isSubmitting={createMutation.isPending}
          isSavingDraft={draftMutation.isPending}
          onEnhanceDescription={handleEnhance}
          stepperMode
        />
      </Container>

      {/* ── Profile completion — right-side Drawer (form stays mounted behind it) ── */}
      <Drawer
        anchor="right"
        open={activePanel === 'profile'}
        onClose={() => setActivePanel('form')}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'primary.main',
            flexShrink: 0,
          }}
        >
          <BookmarkAdded
            sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 24 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="white"
              lineHeight={1.2}
            >
              Compléter votre profil
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Brouillon sauvegardé — publiez après avoir complété ces infos.
            </Typography>
          </Box>
          <IconButton
            onClick={() => setActivePanel('form')}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Progress bar */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5, flexShrink: 0 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}
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
              '& .MuiLinearProgress-bar': { bgcolor: '#0d9488' },
            }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
            {steps.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                size="small"
                icon={
                  s.done ? (
                    <CheckCircle
                      sx={{
                        fontSize: '14px !important',
                        color: 'success.main',
                      }}
                    />
                  ) : undefined
                }
                color={s.done ? 'default' : 'warning'}
                variant={s.done ? 'outlined' : 'filled'}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  textDecoration: s.done ? 'line-through' : 'none',
                  opacity: s.done ? 0.55 : 1,
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Scrollable form fields */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Prénom"
                size="small"
                value={profileForm.firstname}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, firstname: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nom"
                size="small"
                value={profileForm.lastname}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, lastname: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <PhoneField
                value={profileForm.phone_number}
                onChange={(val) =>
                  setProfileForm((f) => ({ ...f, phone_number: val }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={profileCities}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                value={profileCity}
                inputValue={profileCityInput}
                onInputChange={(_, v) => setProfileCityInput(v)}
                onChange={(_, v) => setProfileCity(v)}
                slotProps={profileCitySlotProps}
                renderOption={renderProfileCityOption}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ville"
                    size="small"
                    sx={profileCityInputSx}
                  />
                )}
                noOptionsText="Aucune ville trouvée"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Bio publique
              </Typography>
              <MarkdownBioEditor
                value={profileForm.bio}
                onChange={(val) => setProfileForm((f) => ({ ...f, bio: val }))}
                maxLength={2000}
                placeholder="Décrivez-vous : votre expérience, vos biens, votre zone d'activité…"
              />
            </Grid>
          </Grid>

          {profileSaveError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {profileSaveError}
            </Alert>
          )}
        </Box>

        {/* Sticky footer actions */}
        <Divider />
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => setActivePanel('form')}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              color: 'text.secondary',
              borderColor: 'divider',
            }}
          >
            Retour
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveInlineProfile}
            disabled={
              isSavingProfile || !profileForm.firstname || !profileForm.lastname
            }
            startIcon={
              isSavingProfile ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
              ) : (
                <CheckCircle />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            {isSavingProfile ? 'Sauvegarde…' : 'Sauvegarder et publier'}
          </Button>
        </Box>
      </Drawer>

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
                if (draft) {
                  setRestoredDraft(draft);
                  setFormKey((k) => k + 1);
                }
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

      {/* Draft save feedback */}
      <Snackbar
        open={!!draftSnackbar}
        autoHideDuration={4000}
        onClose={() => setDraftSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={draftSnackbar?.severity ?? 'success'}
          onClose={() => setDraftSnackbar(null)}
          variant="filled"
        >
          {draftSnackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
