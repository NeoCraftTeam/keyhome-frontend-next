'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useServerAutoSave } from '@/hooks/useServerAutoSave';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { compressAdPhotos } from '@/lib/image-compression';
import { adsService } from '@/services/ads.service';
import {
  adTypesService,
  citiesService,
  quartersService,
} from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import type { Ad, AdImage, AdType, City, Quarter } from '@/types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PublishIcon from '@mui/icons-material/Publish';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Drawer,
  Fab,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdFormBasicInfo,
  AdFormBoost,
  AdFormEquipment,
  AdFormFeatures,
  AdFormLocation,
  AdFormMapLocation,
  AdFormPhotos,
  AdFormPremiumInfo,
  AdFormTour,
} from './ad-form';
import {
  AdTypeCategory,
  getCategoryById,
  getCategoryForAdType,
} from './ad-form/ad-type-categories';
import AdFormPriceAdvisor from './ad-form/AdFormPriceAdvisor';
import AdFormStepReview from './ad-form/AdFormStepReview';
import AdFormStepType from './ad-form/AdFormStepType';
import type { AdFormValues, AttributeOption, TourScene } from './ad-form/types';
import {
  coerceAdFormFieldValue,
  isAdFormTextEmpty,
  normalizeAdFormValues,
} from './ad-form/types';
import AdFormLivePreview from './AdFormLivePreview';
import ListingQualityBar from './ListingQualityBar';

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
  /**
   * Edit-draft mode — for modifying live (non-DRAFT) ads.
   * Auto-save is disabled; each step shows explicit Save/Cancel buttons that
   * write to `draft_payload` without touching the published ad.
   */
  editDraftMode?: boolean;
  /** Called when the owner saves a step in editDraftMode. */
  onSaveEditDraft?: (fields: Record<string, unknown>) => Promise<void>;
  /** Called when the owner applies all pending edits. */
  onApplyEditDraft?: () => Promise<void>;
  /** Called when the owner discards all pending edits. */
  onDiscardEditDraft?: () => Promise<void>;
  /** Whether an apply/discard action is in progress. */
  isApplyingEditDraft?: boolean;
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
  editDraftMode = false,
  onSaveEditDraft,
  onApplyEditDraft,
  onDiscardEditDraft,
  isApplyingEditDraft = false,
}: AdFormWizardProps) {
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [stepSavedAt, setStepSavedAt] = useState<Date | null>(null);
  /* ── Step state ── */
  const [activeStep, setActiveStep] = useState(0);

  /* ── Form data ── */
  const [values, setValues] = useState<AdFormValues>(() =>
    normalizeAdFormValues(initialData)
  );

  const seededFromInitialDataRef = useRef<string | null>(null);
  useEffect(() => {
    const seedKey = ad?.id ?? 'new-ad';
    if (seededFromInitialDataRef.current === seedKey) {
      return;
    }
    seededFromInitialDataRef.current = seedKey;
    setValues(normalizeAdFormValues(initialData));
  }, [ad?.id, initialData]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [propertyConditionPdf, setPropertyConditionPdf] = useState<File | null>(
    null
  );
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

  /* ── Server-side auto-save ──
   * Builds a plain JSON snapshot of every text/structured field the backend
   * `autosave` endpoint accepts. **Images** (photos, panoramas, PDF) are
   * intentionally NOT auto-saved — only the manual "Enregistrer le brouillon"
   * (full PUT multipart) handles media. This is communicated to the user via
   * the helperText next to the save button.
   *
   * Whitelist mirrors `AdStatusController::autosave()` validation rules.
   */
  const autoSaveData = useMemo(
    () => ({
      title: values.title,
      description: values.description,
      adresse: values.adresse,
      price: values.price,
      price_period: values.price_period,
      surface_area: values.surface_area,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      has_parking: values.has_parking,
      deposit_amount: values.deposit_amount,
      minimum_lease_duration: values.minimum_lease_duration,
      charges_forfaitaires: values.charges_forfaitaires,
      charges_montant_forfait: values.charges_montant_forfait,
      charges_eau: values.charges_eau,
      charges_electricite: values.charges_electricite,
      charges_autres: values.charges_autres,
      quarter_id: values.quarter_id,
      type_id: values.type_id,
      transaction_type: values.transaction_type,
      latitude: values.latitude,
      longitude: values.longitude,
      distance_main_road_m: values.distance_main_road_m,
      distance_shops_m: values.distance_shops_m,
      distance_transport_m: values.distance_transport_m,
      distance_school_m: values.distance_school_m,
      distance_hospital_m: values.distance_hospital_m,
      attributes: values.attributes,
    }),
    [values]
  );

  const onCreateDraftCb = useCallback(
    async (data: typeof autoSaveData): Promise<string> => {
      const formData = new FormData();
      (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') {
          return;
        }
        if (Array.isArray(v)) {
          // Skip empty arrays so we don't overwrite server-side values with []
          // until the user explicitly interacts with the chips.
          if (v.length === 0) {
            return;
          }
          v.forEach((item, idx) => {
            formData.append(`${k}[${idx}]`, String(item));
          });
          return;
        }
        formData.append(
          k,
          typeof v === 'boolean' ? (v ? '1' : '0') : String(v)
        );
      });
      const created = await adsService.saveDraft(formData);
      return created.id;
    },
    []
  );

  const onUpdateDraftCb = useCallback(
    async (id: string, data: typeof autoSaveData): Promise<void> => {
      // PATCH /ads/{id}/autosave is a JSON endpoint; arrays/booleans/numerics
      // are sent as-is. Empty strings are dropped so a never-touched field
      // doesn't blank a previously-saved value.
      const payload: Record<string, unknown> = {};
      (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
        if (v === undefined || v === '') {
          return;
        }
        payload[k] = v;
      });
      await adsService.autosaveDraft(
        id,
        payload as Partial<Record<string, string | number | boolean | null>>
      );
    },
    []
  );

  const {
    savedAt,
    isSaving: isAutoSaving,
    draftId: autoSaveDraftId,
    lastError: autoSaveError,
    clearSavedAt,
  } = useServerAutoSave({
    data: autoSaveData,
    draftId: ad?.id ?? null,
    onCreateDraft: onCreateDraftCb,
    onUpdateDraft: onUpdateDraftCb,
    // Auto-save is intentionally disabled in editDraftMode — the owner uses
    // explicit per-step Save/Cancel buttons instead.
    enabled:
      !editDraftMode &&
      !isSubmitting &&
      !isSavingDraft &&
      !isAdFormTextEmpty(values.title),
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
    queryFn: ({ signal }) =>
      citiesService.list({ q: cityInput, per_page: 50 }, { signal }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: quartersData, isFetching: isQuartersLoading } = useQuery({
    queryKey: ['ad-form-quarters', selectedCity?.id, quarterInput],
    queryFn: ({ signal }) =>
      quartersService.list(
        {
          city_id: selectedCity?.id,
          q: quarterInput,
          per_page: 50,
        },
        { signal }
      ),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adTypesData } = useQuery({
    queryKey: ['ad-types'],
    queryFn: ({ signal }) => adTypesService.list({ signal }),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const { data: attrData } = useQuery({
    queryKey: ['property-attributes'],
    queryFn: ({ signal }) => propertyAttributesService.list({ signal }),
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

  const tourSceneCount = useMemo(
    () => tourScenes.filter((s) => Boolean(s.previewUrl || s.file)).length,
    [tourScenes]
  );

  const livePreviewProps = useMemo(
    () => ({
      values,
      imagePreviewUrls,
      existingImages: ad?.images ?? [],
      imagesToDelete,
      selectedQuarter,
      selectedCity,
      adType: adTypes.find((t) => t.id === values.type_id) ?? null,
      attributeOptions: autocompleteOptions,
      tourSceneCount,
    }),
    [
      values,
      imagePreviewUrls,
      ad?.images,
      imagesToDelete,
      selectedQuarter,
      selectedCity,
      adTypes,
      autocompleteOptions,
      tourSceneCount,
    ]
  );

  /* ── Field update ── */
  const update = (
    field: keyof AdFormValues,
    value: AdFormValues[keyof AdFormValues]
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: coerceAdFormFieldValue(field, value),
    }));
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

  const reorderImages = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setImagePreviewUrls((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  const openPhotoLightbox = (index: number) => {
    setPhotoLightboxIndex(index);
    setPhotoLightboxOpen(true);
  };

  /* ── AI enhance ── */
  const handleEnhance = async () => {
    if (isAdFormTextEmpty(values.description) || !onEnhanceDescription) return;
    setEnhancing(true);
    try {
      const enhanced = await onEnhanceDescription(values.description);
      update('description', enhanced);
    } catch {
      setEnhanceError(
        "Impossible d'améliorer la description. Vérifiez votre connexion et réessayez."
      );
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
        if (isAdFormTextEmpty(values.title))
          e.title = 'Le titre est obligatoire.';
        if (isAdFormTextEmpty(values.description))
          e.description = 'La description est obligatoire.';
        // Require at least 4 images
        const existingCount =
          ad?.images?.filter((img) => !imagesToDelete.includes(img.id))
            .length ?? 0;
        const totalImages = images.length + existingCount;
        if (totalImages < 4)
          e.images = 'Veuillez ajouter au moins 4 photos pour continuer.';
        break;
      }
      case 2: {
        // Details — type-specific
        if (!hiddenFields.has('adresse') && isAdFormTextEmpty(values.adresse))
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
          if (isAdFormTextEmpty(values.title))
            stepErrors.title = 'Le titre est obligatoire.';
          if (isAdFormTextEmpty(values.description))
            stepErrors.description = 'La description est obligatoire.';
          break;
        }
        case 2: {
          if (!hiddenFields.has('adresse') && isAdFormTextEmpty(values.adresse))
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
    if (isAdFormTextEmpty(values.title)) {
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

  /* ── Edit-draft: save current step fields to server draft_payload ── */
  const handleSaveStep = useCallback(async () => {
    if (!onSaveEditDraft || isSavingStep) return;
    setIsSavingStep(true);
    try {
      // Build a plain-object snapshot of the current form values
      const fields: Record<string, unknown> = {
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
        charges_montant_forfait: values.charges_montant_forfait,
        charges_eau: values.charges_eau,
        charges_electricite: values.charges_electricite,
        charges_autres: values.charges_autres,
        quarter_id: values.quarter_id,
        type_id: values.type_id,
        transaction_type: values.transaction_type,
        latitude: values.latitude,
        longitude: values.longitude,
        distance_main_road_m: values.distance_main_road_m,
        distance_shops_m: values.distance_shops_m,
        distance_transport_m: values.distance_transport_m,
        distance_school_m: values.distance_school_m,
        distance_hospital_m: values.distance_hospital_m,
        attributes: values.attributes,
      };
      await onSaveEditDraft(fields);
      setStepSavedAt(new Date());
    } catch {
      // error surfaced by caller
    } finally {
      setIsSavingStep(false);
    }
  }, [onSaveEditDraft, isSavingStep, values]);

  /* ── Edit-draft: cancel discards all pending changes ── */
  const handleCancelEditDraft = useCallback(async () => {
    if (!onDiscardEditDraft) return;
    await onDiscardEditDraft();
  }, [onDiscardEditDraft]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateAll()) return;

    if (onBeforeSubmit) {
      const shouldProceed = await onBeforeSubmit(values);
      if (!shouldProceed) return;
    }

    try {
      await onSubmit(values, images, {
        imagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
        tourScenes: tourScenes.length > 0 ? tourScenes : undefined,
        propertyConditionPdf,
      });
      clearDraft();
    } catch {
      // Error feedback is handled by the caller's mutation onError handler.
    }
  };

  /* ── Determine if a step is the last real step ── */
  const isReviewStep = activeStep === 5;

  /* ── Existing images count ── */
  const existingImageCount = (ad?.images?.length ?? 0) - imagesToDelete.length;

  /* ── Image count for step 1 gating ── */
  const existingVisibleCount =
    ad?.images?.filter((img) => !imagesToDelete.includes(img.id)).length ?? 0;
  const totalImageCount = images.length + existingVisibleCount;
  const nextDisabled =
    isSubmitting || (activeStep === 1 && totalImageCount < 4);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <>
      <Box
        sx={{
          display: { xs: 'block', md: 'flex' },
          gap: { md: 3, lg: 4 },
          alignItems: 'flex-start',
          ml: { md: -2 },
          width: '100%',
        }}
      >
        {/* ── Left column: Form (largeur maîtrisée pour laisser place à l’aperçu) ── */}
        <Box
          sx={{
            width: { xs: '100%', md: 480, lg: 520, xl: 540 },
            flexShrink: 0,
            minWidth: 0,
            maxWidth: { md: 560 },
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* ── Stepper — sticky so it stays visible as the user scrolls ── */}
              <Box
                sx={{
                  position: 'sticky',
                  top: { xs: 56, md: 72 },
                  zIndex: 10,
                  bgcolor: 'background.default',
                  pt: 1,
                  pb: 0.5,
                  mx: -2,
                  px: 2,
                }}
              >
                <AuthFlowStepper labels={STEP_LABELS} activeStep={activeStep} />
              </Box>

              {/* ══════════════════ Quality bar ══════════════════ */}
              {activeStep > 0 && (
                <ListingQualityBar
                  values={values}
                  photosCount={totalImageCount}
                  has3dTour={tourSceneCount > 0 || !!ad?.has_3d_tour}
                />
              )}

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
                    onReorderImages={reorderImages}
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
                    <AdFormFeatures
                      values={values}
                      update={update}
                      errors={errors}
                    />
                  )}
                </Box>
              </Collapse>

              {/* ══════════════════ Step 3: Equipment & Conditions ══════════════════ */}
              <Collapse in={activeStep === 3} unmountOnExit>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  <AdFormTour
                    tourScenes={tourScenes}
                    ad={ad}
                    errors={errors}
                    onAddScene={addTourScene}
                    onUpdateScene={updateTourScene}
                    onRemoveScene={removeTourScene}
                  />
                  <AdFormPriceAdvisor
                    values={values}
                    cityId={selectedCity?.id}
                  />
                  <AdFormBoost />
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
                  flexDirection: { xs: 'column-reverse', sm: 'row' },
                  gap: { xs: 1.5, sm: 2 },
                  justifyContent: 'space-between',
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* Left side */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    alignItems: 'flex-start',
                  }}
                >
                  {editDraftMode ? (
                    /* Edit-draft mode: explicit Save step + Cancel all buttons */
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleSaveStep}
                        disabled={isSavingStep || isApplyingEditDraft}
                        startIcon={
                          isSavingStep ? (
                            <CircularProgress size={14} />
                          ) : stepSavedAt ? (
                            <CheckCircleOutlined
                              sx={{ color: 'success.main', fontSize: 16 }}
                            />
                          ) : (
                            <SaveOutlined sx={{ fontSize: 16 }} />
                          )
                        }
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderColor: stepSavedAt ? 'success.main' : undefined,
                          color: stepSavedAt ? 'success.main' : undefined,
                        }}
                      >
                        {isSavingStep
                          ? 'Sauvegarde...'
                          : stepSavedAt
                            ? `Enregistré ${stepSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Sauvegarder cette étape'}
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        color="error"
                        onClick={handleCancelEditDraft}
                        disabled={isSavingStep || isApplyingEditDraft}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        Annuler les modifications
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {onSaveDraft && (
                        <Tooltip
                          title={autoSaveError ? autoSaveError.message : ''}
                          disableHoverListener={!autoSaveError}
                          arrow
                          enterDelay={400}
                        >
                          <span>
                            <Button
                              variant="text"
                              size="small"
                              onClick={
                                isAutoSaving || isSavingDraft
                                  ? undefined
                                  : handleSaveDraft
                              }
                              disabled={isSubmitting || isSavingDraft}
                              startIcon={
                                isAutoSaving || isSavingDraft ? (
                                  <CircularProgress size={14} />
                                ) : autoSaveError ? (
                                  <SaveOutlined
                                    sx={{ color: 'warning.main', fontSize: 16 }}
                                  />
                                ) : savedAt ? (
                                  <CheckCircleOutlined
                                    sx={{ color: 'success.main', fontSize: 16 }}
                                  />
                                ) : (
                                  <SaveOutlined sx={{ fontSize: 16 }} />
                                )
                              }
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'none',
                                color: autoSaveError
                                  ? 'warning.main'
                                  : savedAt
                                    ? 'success.main'
                                    : 'text.secondary',
                                '&:hover': {
                                  bgcolor: autoSaveError
                                    ? 'warning.50'
                                    : savedAt
                                      ? 'success.50'
                                      : undefined,
                                },
                              }}
                            >
                              {isAutoSaving
                                ? 'Sauvegarde...'
                                : isSavingDraft
                                  ? 'Sauvegarde...'
                                  : autoSaveError
                                    ? 'Brouillon · Sauvegarde auto en échec'
                                    : savedAt
                                      ? `Brouillon · Enregistré le ${savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                      : draftLabel}
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                      {onSaveDraft && (
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            px: 1,
                            maxWidth: 420,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              lineHeight: 1.3,
                            }}
                          >
                            Texte et infos enregistrés automatiquement. Photos,
                            visite 360° et PDF : utilisez « Enregistrer le
                            brouillon ».
                          </Box>
                          {autoSaveError && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: 'warning.main',
                                lineHeight: 1.35,
                                wordBreak: 'break-word',
                              }}
                            >
                              {autoSaveError.message}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                {/* Right side */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    ml: { sm: 'auto' },
                    justifyContent: { xs: 'flex-end', sm: 'unset' },
                  }}
                >
                  {onCancel && activeStep === 0 && !editDraftMode && (
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
                      size="small"
                      startIcon={<ArrowBackIcon />}
                      onClick={handleBack}
                      disabled={isSubmitting || isApplyingEditDraft}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Précédent
                    </Button>
                  )}
                  {!isReviewStep ? (
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleNext}
                      disabled={nextDisabled || isApplyingEditDraft}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        px: 2.5,
                      }}
                    >
                      Suivant
                    </Button>
                  ) : editDraftMode ? (
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      disabled={isApplyingEditDraft}
                      onClick={onApplyEditDraft}
                      startIcon={
                        isApplyingEditDraft ? (
                          <CircularProgress size={16} />
                        ) : (
                          <PublishIcon />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        px: 3,
                      }}
                    >
                      Appliquer les modifications
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="small"
                      variant="contained"
                      disabled={isSubmitting || isSavingDraft}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={16} />
                        ) : (
                          <PublishIcon />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        px: 3,
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
        </Box>

        {/* ── Right column: Live Preview — grande colonne fluide (desktop) ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            flex: '1 1 0%',
            minWidth: { md: 420, lg: 480, xl: 520 },
            position: 'sticky',
            top: 80,
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 96px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.300',
              borderRadius: 2,
            },
          }}
        >
          <AdFormLivePreview {...livePreviewProps} />
        </Box>

        {/* AI enhance error snackbar */}
        <Snackbar
          open={!!enhanceError}
          autoHideDuration={5000}
          onClose={() => setEnhanceError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setEnhanceError(null)}>
            {enhanceError}
          </Alert>
        </Snackbar>
      </Box>

      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          right: 16,
          bottom: `calc(88px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 1090,
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
        }}
      >
        <Fab
          color="primary"
          size="medium"
          aria-label="Aperçu de l'annonce en direct"
          onClick={() => setMobilePreviewOpen(true)}
        >
          <VisibilityIcon />
        </Fab>
      </Box>

      <Drawer
        anchor="bottom"
        open={mobilePreviewOpen}
        onClose={() => setMobilePreviewOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: 'min(92dvh, 900px)',
          },
        }}
        sx={{ display: { xs: 'block', md: 'none' }, zIndex: 1200 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Aperçu en direct
          </Typography>
          <IconButton
            onClick={() => setMobilePreviewOpen(false)}
            aria-label="Fermer l'aperçu"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            overflowY: 'auto',
            maxHeight: 'calc(min(92dvh, 900px) - 52px)',
            p: 2,
          }}
        >
          <AdFormLivePreview {...livePreviewProps} />
        </Box>
      </Drawer>
    </>
  );
}

export default memo(AdFormWizard);
