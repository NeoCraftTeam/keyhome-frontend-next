'use client';

import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import PublishIcon from '@mui/icons-material/Publish';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import ImageLightbox from '@/components/ui/ImageLightbox';
import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import { compressAdPhotos } from '@/lib/image-compression';
import { useServerAutoSave } from '@/hooks/useServerAutoSave';
import type { Ad, AdImage, AdType, City, Quarter } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  adTypesService,
  citiesService,
  quartersService,
} from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import { adsService } from '@/services/ads.service';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import {
  AdFormBasicInfo,
  AdFormPhotos,
  AdFormLocation,
  AdFormFeatures,
  AdFormEquipment,
  AdFormPremiumInfo,
  AdFormTour,
  AdFormBoost,
  AdFormMapLocation,
} from './ad-form';
import type { AttributeOption } from './ad-form/types';
import { initialValues } from './ad-form/types';
import type { AdFormValues, TourScene } from './ad-form/types';
import AdFormPriceAdvisor from './ad-form/AdFormPriceAdvisor';
import AdFormStepType from './ad-form/AdFormStepType';
import AdFormStepReview from './ad-form/AdFormStepReview';
import {
  AdTypeCategory,
  getCategoryForAdType,
  getCategoryById,
} from './ad-form/ad-type-categories';

export type { AdFormValues, TourScene } from './ad-form/types';

/* ------------------------------------------------------------------ */
/*  Step definitions                                                    */
/* ------------------------------------------------------------------ */

const BASE_STEP_LABELS = [
  'Type',
  'Infos',
  'Détails',
  'Conditions',
  'Médias',
  'Résumé',
];

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface AdFormWizardProps {
  initialData?: Partial<AdFormValues> | null;
  ad?: Ad | null;
  onSubmit: (
    values: AdFormValues,
    images: File[],
    options?: {
      imagesToDelete?: number[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
    }
  ) => Promise<void>;
  onBeforeSubmit?: (values: AdFormValues) => Promise<boolean>;
  onSaveDraft?: (
    values: AdFormValues,
    images: File[],
    options?: {
      imagesToDelete?: number[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
    }
  ) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  draftLabel?: string;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  onEnhanceDescription?: (description: string) => Promise<string>;
  /** Called once when server-side auto-save creates a new draft (new-ad flow only). */
  onDraftCreated?: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

function AdFormWizard({
  initialData,
  ad,
  onSubmit,
  onBeforeSubmit,
  onSaveDraft,
  onCancel,
  submitLabel = "Créer l'annonce",
  draftLabel = 'Enregistrer le brouillon',
  isSubmitting = false,
  isSavingDraft = false,
  onEnhanceDescription,
  onDraftCreated,
}: AdFormWizardProps) {
  /* ── Step state ── */
  const [activeStep, setActiveStep] = useState(0);

  /* ── Form data ── */
  const [values, setValues] = useState<AdFormValues>(() => ({
    ...initialValues,
    ...initialData,
  }));
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [propertyConditionPdf, setPropertyConditionPdf] = useState<File | null>(
    null
  );
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);
  const [compressingPhotos, setCompressingPhotos] = useState(false);

  /* ── Category state ── */
  const [selectedCategory, setSelectedCategory] =
    useState<AdTypeCategory | null>(() => {
      // Infer category from existing ad type
      if (ad?.type?.name) {
        const cat = getCategoryForAdType(ad.type.name);
        return cat?.id ?? null;
      }
      if (initialData?.type_id) return null; // Will be resolved once adTypes load
      return null;
    });

  /* ── Server-side auto-save ── */
  // Builds a plain JSON object from form values (no images — too heavy for autosave)
  const autoSaveData = useMemo(
    () => ({
      title: values.title,
      description: values.description,
      adresse: values.adresse,
      price: values.price,
      surface_area: values.surface_area,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      has_parking: values.has_parking,
      deposit_amount: values.deposit_amount,
      minimum_lease_duration: values.minimum_lease_duration,
      charges_forfaitaires: values.charges_forfaitaires,
      quarter_id: values.quarter_id,
      type_id: values.type_id,
      transaction_type: values.transaction_type,
      latitude: values.latitude,
      longitude: values.longitude,
    }),
    [values]
  );

  const onCreateDraftCb = useCallback(
    async (data: typeof autoSaveData): Promise<string> => {
      const formData = new FormData();
      (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          formData.append(
            k,
            typeof v === 'boolean' ? (v ? '1' : '0') : String(v)
          );
        }
      });
      const created = await adsService.saveDraft(formData);
      return created.id;
    },
    []
  );

  const onUpdateDraftCb = useCallback(
    async (id: string, data: typeof autoSaveData): Promise<void> => {
      await adsService.autosaveDraft(
        id,
        data as Partial<Record<string, string | number | boolean | null>>
      );
    },
    []
  );

  const {
    savedAt,
    isSaving: isAutoSaving,
    draftId: autoSaveDraftId,
    clearSavedAt,
  } = useServerAutoSave({
    data: autoSaveData,
    draftId: ad?.id ?? null,
    onCreateDraft: onCreateDraftCb,
    onUpdateDraft: onUpdateDraftCb,
    enabled: !isSubmitting && !isSavingDraft,
    debounceMs: 5000,
  });

  // Keep clearDraft as a no-op alias so existing call sites don't need changes
  const clearDraft = clearSavedAt;

  // Notify parent once when auto-save first creates a new draft
  const initialDraftIdRef = useRef<string | null>(ad?.id ?? null);
  useEffect(() => {
    if (
      autoSaveDraftId &&
      initialDraftIdRef.current === null &&
      onDraftCreated
    ) {
      onDraftCreated(autoSaveDraftId);
    }
  }, [autoSaveDraftId, onDraftCreated]);

  /* ── 3D Tour state ── */
  const [tourScenes, setTourScenes] = useState<TourScene[]>(() => {
    if (ad?.has_3d_tour && ad.tour_config?.scenes) {
      return ad.tour_config.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        file: null,
        previewUrl: s.image_url || '',
        hotspots: s.hotspots || [],
      }));
    }
    return [];
  });

  useEffect(() => {
    if (!ad?.id || !ad.has_3d_tour) return;
    let cancelled = false;
    adsService
      .getTour(ad.id)
      .then((res) => {
        if (cancelled) return;
        const signedScenes = (
          res.config as { scenes?: Array<{ id: string; image_url?: string }> }
        )?.scenes;
        if (!signedScenes?.length) return;
        setTourScenes((prev) =>
          prev.map((scene) => {
            if (scene.file) return scene;
            const signed = signedScenes.find((s) => s.id === scene.id);
            return signed?.image_url
              ? { ...scene, previewUrl: signed.image_url }
              : scene;
          })
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ad?.id, ad?.has_3d_tour]);

  /* ── City/Quarter autocomplete ── */
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();

  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    if (ad?.quarter?.city_id && ad?.quarter?.city_name) {
      return { id: ad.quarter.city_id, name: ad.quarter.city_name };
    }
    return null;
  });
  const [cityInput, setCityInput] = useState(ad?.quarter?.city_name || '');
  const [quarterInput, setQuarterInput] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(() => {
    if (ad?.quarter) {
      return {
        id: ad.quarter.id,
        name: ad.quarter.name,
        city_id: ad.quarter.city_id || '',
        city_name: ad.quarter.city_name || '',
      };
    }
    return null;
  });

  /* ── Data queries ── */
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['ad-form-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 50 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: quartersData, isFetching: isQuartersLoading } = useQuery({
    queryKey: ['ad-form-quarters', selectedCity?.id, quarterInput],
    queryFn: () =>
      quartersService.list({
        city_id: selectedCity?.id,
        q: quarterInput,
        per_page: 50,
      }),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adTypesData } = useQuery({
    queryKey: ['ad-types'],
    queryFn: () => adTypesService.list(),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const { data: attrData } = useQuery({
    queryKey: ['property-attributes'],
    queryFn: () => propertyAttributesService.list(),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const cities = (citiesData?.data ?? []) as City[];
  const quarters = (quartersData?.data ?? []) as Quarter[];
  const adTypes = useMemo(() => (adTypesData ?? []) as AdType[], [adTypesData]);
  const groupedAttrs = useMemo(
    () =>
      (attrData?.grouped ?? []) as Array<{
        name?: string;
        group?: string;
        attributes?: Array<{ value: string; label: string; icon?: string }>;
      }>,
    [attrData?.grouped]
  );

  const autocompleteOptions = useMemo<AttributeOption[]>(() => {
    const opts = groupedAttrs.flatMap((g) =>
      (g.attributes ?? []).map((attr) => ({
        ...attr,
        group: (g.name ?? g.group ?? 'Autre') as string,
      }))
    );
    opts.sort((a, b) => a.group.localeCompare(b.group));
    return opts;
  }, [groupedAttrs]);

  /* Infer category from initialData.type_id once adTypes load */
  useEffect(() => {
    if (selectedCategory || !initialData?.type_id || !adTypes.length) return;
    const adType = adTypes.find((t) => t.id === initialData.type_id);
    if (adType) {
      const cat = getCategoryForAdType(adType.name);
      if (cat) setSelectedCategory(cat.id);
    }
  }, [selectedCategory, initialData?.type_id, adTypes]);

  const categoryConfig = selectedCategory
    ? getCategoryById(selectedCategory)
    : undefined;
  const hiddenFields = new Set(categoryConfig?.hiddenFields ?? []);

  /* Dynamic step labels — adapt Step 3 label based on category */
  const STEP_LABELS = useMemo(() => {
    const labels = [...BASE_STEP_LABELS];
    if (selectedCategory === AdTypeCategory.TERRAIN) {
      labels[3] = 'Équipements';
    }
    return labels;
  }, [selectedCategory]);

  /* ── Lightbox images ── */
  const lightboxImages = useMemo<AdImage[]>(
    () => [
      ...imagePreviewUrls.map((url, i) => ({
        id: -i - 1,
        url,
        thumb: url,
        large: url,
        placeholder: null,
        mime_type: 'image/jpeg',
        is_primary: i === 0,
      })),
      ...(ad?.images?.filter((img) => !imagesToDelete.includes(img.id)) ?? []),
    ],
    [imagePreviewUrls, imagesToDelete, ad?.images]
  );

  /* ── Field update ── */
  const update = (
    field: keyof AdFormValues,
    value: AdFormValues[keyof AdFormValues]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /* ── Image handlers ── */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;
    if (images.length + rawFiles.length > 10) {
      setErrors((prev) => ({ ...prev, images: 'Maximum 10 photos.' }));
      return;
    }
    setCompressingPhotos(true);
    try {
      const results = await compressAdPhotos(rawFiles);
      const compressed = results.map((r) => r.file);
      setImages((prev) => [...prev, ...compressed]);
      const newUrls = compressed.map((f) => URL.createObjectURL(f));
      setImagePreviewUrls((prev) => [...prev, ...newUrls]);
    } finally {
      setCompressingPhotos(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openPhotoLightbox = (index: number) => {
    setPhotoLightboxIndex(index);
    setPhotoLightboxOpen(true);
  };

  /* ── AI enhance ── */
  const handleEnhance = async () => {
    if (!values.description.trim() || !onEnhanceDescription) return;
    setEnhancing(true);
    try {
      const enhanced = await onEnhanceDescription(values.description);
      update('description', enhanced);
    } finally {
      setEnhancing(false);
    }
  };

  /* ── Tour handlers ── */
  const addTourScene = useCallback(() => {
    setTourScenes((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: '',
        file: null,
        previewUrl: '',
        hotspots: [],
      },
    ]);
  }, []);

  const updateTourScene = useCallback(
    (
      index: number,
      field: keyof TourScene,
      value: TourScene[keyof TourScene]
    ) => {
      setTourScenes((prev) =>
        prev.map((s, i) => {
          if (i !== index) return s;
          if (field === 'file' && value instanceof File) {
            if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
            return {
              ...s,
              file: value,
              previewUrl: URL.createObjectURL(value),
            };
          }
          return { ...s, [field]: value };
        })
      );
    },
    []
  );

  const removeTourScene = useCallback((index: number) => {
    setTourScenes((prev) => {
      const scene = prev[index];
      if (scene?.previewUrl) URL.revokeObjectURL(scene.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /* ── City change handler ── */
  const handleCityChange = useCallback((city: City | null) => {
    setSelectedCity(city);
    setSelectedQuarter(null);
    setQuarterInput('');
    setValues((prev) => ({ ...prev, quarter_id: '' }));
    setErrors((prev) => ({ ...prev, quarter_id: '' }));
  }, []);

  /* ── Step validation ── */
  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};

    switch (step) {
      case 0: {
        // Type & Transaction
        if (!values.transaction_type)
          e.transaction_type = 'Veuillez choisir le type de transaction.';
        if (!selectedCategory) e.type_id = 'Veuillez choisir une catégorie.';
        else if (!values.type_id)
          e.type_id = "Veuillez préciser le type d'annonce.";
        break;
      }
      case 1: {
        // Basic info + photos
        if (!values.title.trim()) e.title = 'Le titre est obligatoire.';
        if (!values.description.trim())
          e.description = 'La description est obligatoire.';
        break;
      }
      case 2: {
        // Details — type-specific
        if (!hiddenFields.has('adresse') && !values.adresse.trim())
          e.adresse = "L'adresse est obligatoire.";
        if (!values.price || parseFloat(values.price) < 0)
          e.price = 'Le prix est obligatoire.';
        if (
          !hiddenFields.has('surface_area') &&
          (!values.surface_area || parseFloat(values.surface_area) <= 0)
        )
          e.surface_area = 'La surface est obligatoire.';
        if (!hiddenFields.has('bedrooms') && parseInt(values.bedrooms, 10) < 0)
          e.bedrooms = 'Nombre de chambres invalide.';
        if (
          !hiddenFields.has('bathrooms') &&
          parseInt(values.bathrooms, 10) < 0
        )
          e.bathrooms = 'Nombre de salles de bain invalide.';
        if (!values.quarter_id) e.quarter_id = 'Le quartier est obligatoire.';
        break;
      }
      case 3: {
        // Equipment & Conditions — optional, no required validation
        break;
      }
      case 4: {
        // Media & Map — validate tour scenes if any
        tourScenes.forEach((scene, i) => {
          if (!scene.title.trim())
            e[`tour_scene_${i}_title`] = 'Nom de la pièce obligatoire.';
          if (!scene.file && !ad?.has_3d_tour)
            e[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
        });
        break;
      }
      default:
        break;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAll = (): boolean => {
    const allErrors: Record<string, string> = {};
    // Run validation logic for steps 0-4 (step 5 is review, no validation)
    for (let step = 0; step <= 4; step++) {
      // Temporarily validate without setting state
      const stepErrors: Record<string, string> = {};
      switch (step) {
        case 0: {
          if (!values.transaction_type)
            stepErrors.transaction_type =
              'Veuillez choisir le type de transaction.';
          if (!selectedCategory)
            stepErrors.type_id = 'Veuillez choisir une catégorie.';
          else if (!values.type_id)
            stepErrors.type_id = "Veuillez préciser le type d'annonce.";
          break;
        }
        case 1: {
          if (!values.title.trim())
            stepErrors.title = 'Le titre est obligatoire.';
          if (!values.description.trim())
            stepErrors.description = 'La description est obligatoire.';
          break;
        }
        case 2: {
          if (!hiddenFields.has('adresse') && !values.adresse.trim())
            stepErrors.adresse = "L'adresse est obligatoire.";
          if (!values.price || parseFloat(values.price) < 0)
            stepErrors.price = 'Le prix est obligatoire.';
          if (
            !hiddenFields.has('surface_area') &&
            (!values.surface_area || parseFloat(values.surface_area) <= 0)
          )
            stepErrors.surface_area = 'La surface est obligatoire.';
          if (!values.quarter_id)
            stepErrors.quarter_id = 'Le quartier est obligatoire.';
          break;
        }
        case 4: {
          tourScenes.forEach((scene, i) => {
            if (!scene.title.trim())
              stepErrors[`tour_scene_${i}_title`] =
                'Nom de la pièce obligatoire.';
            if (!scene.file && !ad?.has_3d_tour)
              stepErrors[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
          });
          break;
        }
      }
      Object.assign(allErrors, stepErrors);
    }
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Jump to the first step with an error
      const errorFields = Object.keys(allErrors);
      const stepFieldMap: Record<number, string[]> = {
        0: ['transaction_type', 'type_id'],
        1: ['title', 'description'],
        2: ['adresse', 'price', 'surface_area', 'quarter_id'],
        4: errorFields.filter((f) => f.startsWith('tour_scene_')),
      };
      for (const [step, fields] of Object.entries(stepFieldMap)) {
        if (fields.some((f) => errorFields.includes(f))) {
          setActiveStep(Number(step));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        }
      }
      return false;
    }
    return true;
  };

  /* ── Navigation ── */
  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Draft save ── */
  const handleSaveDraft = async () => {
    if (isSavingDraft || isSubmitting) return;
    if (!values.title.trim()) {
      setErrors({
        title: 'Le titre est obligatoire pour enregistrer un brouillon.',
      });
      return;
    }
    if (!onSaveDraft) return;
    try {
      await onSaveDraft(values, images, {
        imagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
        tourScenes: tourScenes.length > 0 ? tourScenes : undefined,
        propertyConditionPdf,
      });
      clearDraft();
    } catch {
      // handled by caller
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateAll()) return;

    if (onBeforeSubmit) {
      const shouldProceed = await onBeforeSubmit(values);
      if (!shouldProceed) return;
    }

    await onSubmit(values, images, {
      imagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
      tourScenes: tourScenes.length > 0 ? tourScenes : undefined,
      propertyConditionPdf,
    });
    clearDraft();
  };

  /* ── Determine if a step is the last real step ── */
  const isReviewStep = activeStep === 5;

  /* ── Existing images count ── */
  const existingImageCount = (ad?.images?.length ?? 0) - imagesToDelete.length;

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ── Stepper ── */}
        <AuthFlowStepper labels={STEP_LABELS} activeStep={activeStep} />

        {/* ══════════════════ Step 0: Type ══════════════════ */}
        <Collapse in={activeStep === 0} unmountOnExit>
          <AdFormStepType
            selectedCategory={selectedCategory}
            selectedTransactionType={values.transaction_type}
            selectedTypeId={values.type_id}
            adTypes={adTypes}
            onCategoryChange={setSelectedCategory}
            onTransactionTypeChange={(t) => update('transaction_type', t)}
            onTypeIdChange={(id) => update('type_id', id)}
            errors={errors}
          />
        </Collapse>

        {/* ══════════════════ Step 1: Basic Info + Photos ══════════════════ */}
        <Collapse in={activeStep === 1} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AdFormBasicInfo
              values={values}
              update={update}
              errors={errors}
              enhancing={enhancing}
              onEnhance={onEnhanceDescription ? handleEnhance : null}
            />
            <AdFormPhotos
              imagePreviewUrls={imagePreviewUrls}
              existingImages={ad?.images}
              imagesToDelete={imagesToDelete}
              imageCount={images.length}
              adTitle={ad?.title}
              errors={errors}
              isCompressing={compressingPhotos}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
              onDeleteExistingImage={(id) =>
                setImagesToDelete((prev) => [...prev, id])
              }
              onOpenLightbox={openPhotoLightbox}
            />
          </Box>
        </Collapse>

        {/* ══════════════════ Step 2: Details ══════════════════ */}
        <Collapse in={activeStep === 2} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AdFormLocation
              values={values}
              update={update}
              errors={errors}
              cities={cities}
              quarters={quarters}
              adTypes={adTypes}
              selectedCity={selectedCity}
              selectedQuarter={selectedQuarter}
              cityInput={cityInput}
              quarterInput={quarterInput}
              isCitiesLoading={isCitiesLoading}
              isQuartersLoading={isQuartersLoading}
              onCityInputChange={setCityInput}
              onCityChange={handleCityChange}
              onQuarterInputChange={setQuarterInput}
              onQuarterChange={setSelectedQuarter}
              citySlotProps={citySlotProps}
              renderCityOption={renderCityOption}
              cityInputSx={cityInputSx}
              hideTypeSelector
            />
            {!hiddenFields.has('bedrooms') && (
              <AdFormFeatures values={values} update={update} errors={errors} />
            )}
          </Box>
        </Collapse>

        {/* ══════════════════ Step 3: Equipment & Conditions ══════════════════ */}
        <Collapse in={activeStep === 3} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              Cette étape est optionnelle — vous pouvez passer directement à la
              suite.
            </Typography>
            {!hiddenFields.has('attributes') && (
              <AdFormEquipment
                values={values}
                update={update}
                autocompleteOptions={autocompleteOptions}
              />
            )}
            {!hiddenFields.has('deposit_amount') && (
              <AdFormPremiumInfo
                values={values}
                update={update}
                defaultExpanded={
                  !!(
                    initialData?.deposit_amount ||
                    initialData?.minimum_lease_duration
                  )
                }
                propertyConditionPdf={propertyConditionPdf}
                onPdfChange={setPropertyConditionPdf}
              />
            )}
          </Box>
        </Collapse>

        {/* ══════════════════ Step 4: Media & Location ══════════════════ */}
        <Collapse in={activeStep === 4} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              Cette étape est optionnelle — ajoutez des médias pour enrichir
              votre annonce.
            </Typography>
            <AdFormTour
              tourScenes={tourScenes}
              ad={ad}
              errors={errors}
              onAddScene={addTourScene}
              onUpdateScene={updateTourScene}
              onRemoveScene={removeTourScene}
            />
            <AdFormPriceAdvisor values={values} cityId={selectedCity?.id} />
            <AdFormBoost values={values} update={update} />
            <AdFormMapLocation values={values} update={update} />
          </Box>
        </Collapse>

        {/* ══════════════════ Step 5: Review ══════════════════ */}
        <Collapse in={activeStep === 5} unmountOnExit>
          <AdFormStepReview
            values={values}
            imageCount={images.length}
            existingImageCount={existingImageCount}
            imagesToDeleteCount={imagesToDelete.length}
            tourScenesCount={tourScenes.length}
            hasPdf={!!propertyConditionPdf}
            selectedCategory={selectedCategory}
            adTypes={adTypes}
            onGoToStep={goToStep}
          />
        </Collapse>

        {/* ══════════════════ Navigation ══════════════════ */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Left side */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isAutoSaving && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}
              >
                <CircularProgress size={12} thickness={5} />
                <Typography variant="caption" color="text.disabled">
                  Sauvegarde...
                </Typography>
              </Box>
            )}
            {!isAutoSaving && savedAt && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}
              >
                <CheckCircleOutlined
                  sx={{ fontSize: 14, color: 'success.main' }}
                />
                <Typography variant="caption" color="text.disabled">
                  Brouillon sauvegardé à{' '}
                  {savedAt.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            )}
            {onSaveDraft && (
              <Button
                variant="text"
                size="small"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSavingDraft}
                startIcon={
                  isSavingDraft ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SaveOutlined />
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
              >
                {draftLabel}
              </Button>
            )}
          </Box>

          {/* Right side */}
          <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
            {onCancel && activeStep === 0 && (
              <Button
                onClick={onCancel}
                disabled={isSubmitting || isSavingDraft}
                sx={{ borderRadius: 2 }}
              >
                Annuler
              </Button>
            )}
            {activeStep > 0 && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                disabled={isSubmitting}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Précédent
              </Button>
            )}
            {!isReviewStep ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                disabled={isSubmitting}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 3,
                }}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isSavingDraft}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} />
                  ) : (
                    <PublishIcon />
                  )
                }
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 4,
                  py: 1.25,
                }}
              >
                {submitLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <ImageLightbox
        images={lightboxImages}
        open={photoLightboxOpen}
        initialIndex={photoLightboxIndex}
        onClose={() => setPhotoLightboxOpen(false)}
      />
    </form>
  );
}

export default memo(AdFormWizard);
