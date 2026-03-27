'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { Ad, AdImage, AdType, City, Quarter } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  compressAdPhotos,
  compressTourScene,
  formatFileSize,
} from '@/lib/image-compression';
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

export type { AdFormValues, TourScene } from './ad-form/types';
import type { AdFormValues, TourScene } from './ad-form/types';
import AdFormPriceAdvisor from './ad-form/AdFormPriceAdvisor';

interface AdFormProps {
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
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  onEnhanceDescription?: (description: string) => Promise<string>;
}

export default function AdForm({
  initialData,
  ad,
  onSubmit,
  onCancel,
  submitLabel = "Créer l'annonce",
  isSubmitting = false,
  onEnhanceDescription,
}: AdFormProps) {
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
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionSaved, setCompressionSaved] = useState<string | null>(null);
  const compressionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const autoSaveKey = ad?.id ? `ad-edit-${ad.id}` : 'ad-new';
  const { savedAt, clearDraft } = useAutoSave({
    key: autoSaveKey,
    data: values,
    enabled: !isSubmitting,
  });

  // 3D Tour state
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
  const adTypes = (adTypesData ?? []) as AdType[];
  const groupedAttrs = (attrData?.grouped ?? []) as Array<{
    name?: string;
    group?: string;
    attributes?: Array<{ value: string; label: string; icon?: string }>;
  }>;
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

  const openPhotoLightbox = (index: number) => {
    setPhotoLightboxIndex(index);
    setPhotoLightboxOpen(true);
  };

  const update = (
    field: keyof AdFormValues,
    value: AdFormValues[keyof AdFormValues]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setErrors((prev) => ({ ...prev, images: 'Maximum 10 photos.' }));
      return;
    }

    // Show previews immediately with originals
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls((prev) => [...prev, ...newUrls]);
    setImages((prev) => [...prev, ...files]);

    // Compress in background and swap files
    setIsCompressing(true);
    try {
      const results = await compressAdPhotos(files);
      const compressed = results.map((r) => r.file);
      const totalSaved = results.reduce(
        (sum, r) => sum + (r.originalSize - r.compressedSize),
        0
      );

      // Replace originals with compressed versions
      setImages((prev) => {
        const startIndex = prev.length - files.length;
        return [
          ...prev.slice(0, startIndex),
          ...compressed,
          ...prev.slice(startIndex + files.length),
        ];
      });

      if (totalSaved > 0) {
        setCompressionSaved(`${formatFileSize(totalSaved)} économisés`);
        clearTimeout(compressionTimerRef.current);
        compressionTimerRef.current = setTimeout(
          () => setCompressionSaved(null),
          4000
        );
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

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
    async (
      index: number,
      field: keyof TourScene,
      value: TourScene[keyof TourScene]
    ) => {
      if (field === 'file' && value instanceof File) {
        // Show preview immediately
        setTourScenes((prev) =>
          prev.map((s, i) => {
            if (i !== index) return s;
            if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
            return {
              ...s,
              file: value,
              previewUrl: URL.createObjectURL(value),
            };
          })
        );

        // Compress in background and swap
        try {
          const result = await compressTourScene(value);
          if (result.savedPercent > 0) {
            setTourScenes((prev) =>
              prev.map((s, i) =>
                i === index ? { ...s, file: result.file } : s
              )
            );
            setCompressionSaved(
              `Scène optimisée : ${formatFileSize(result.originalSize - result.compressedSize)} économisés`
            );
            clearTimeout(compressionTimerRef.current);
            compressionTimerRef.current = setTimeout(
              () => setCompressionSaved(null),
              4000
            );
          }
        } catch {
          // Keep original if compression fails
        }
      } else {
        setTourScenes((prev) =>
          prev.map((s, i) => (i !== index ? s : { ...s, [field]: value }))
        );
      }
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

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!values.title.trim()) e.title = 'Le titre est obligatoire.';
    if (!values.description.trim())
      e.description = 'La description est obligatoire.';
    if (!values.adresse.trim()) e.adresse = "L'adresse est obligatoire.";
    if (!values.price || parseFloat(values.price) < 0)
      e.price = 'Le prix est obligatoire.';
    if (!values.surface_area || parseFloat(values.surface_area) <= 0)
      e.surface_area = 'La surface est obligatoire.';
    if (parseInt(values.bedrooms, 10) < 0)
      e.bedrooms = 'Nombre de chambres invalide.';
    if (parseInt(values.bathrooms, 10) < 0)
      e.bathrooms = 'Nombre de salles de bain invalide.';
    if (!values.quarter_id) e.quarter_id = 'Le quartier est obligatoire.';
    if (!values.type_id) e.type_id = "Le type d'annonce est obligatoire.";
    tourScenes.forEach((scene, i) => {
      if (!scene.title.trim())
        e[`tour_scene_${i}_title`] = 'Nom de la pièce obligatoire.';
      if (!scene.file && !ad?.has_3d_tour)
        e[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;
    await onSubmit(values, images, {
      imagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
      tourScenes: tourScenes.length > 0 ? tourScenes : undefined,
      propertyConditionPdf,
    });
    clearDraft();
  };

  const handleCityChange = useCallback((city: City | null) => {
    setSelectedCity(city);
    setSelectedQuarter(null);
    setQuarterInput('');
    update('quarter_id', '');
  }, []);

  return (
    <form onSubmit={handleSubmit} noValidate>
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
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
          onDeleteExistingImage={(id) =>
            setImagesToDelete((prev) => [...prev, id])
          }
          onOpenLightbox={openPhotoLightbox}
        />

        {(isCompressing || compressionSaved) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
            {isCompressing && (
              <>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  Optimisation des images...
                </Typography>
              </>
            )}
            {!isCompressing && compressionSaved && (
              <Typography
                variant="caption"
                color="success.main"
                fontWeight={600}
              >
                ✓ {compressionSaved}
              </Typography>
            )}
          </Box>
        )}

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
        />

        <AdFormFeatures values={values} update={update} errors={errors} />

        <AdFormEquipment
          values={values}
          update={update}
          autocompleteOptions={autocompleteOptions}
        />

        <AdFormPremiumInfo
          values={values}
          update={update}
          defaultExpanded={
            !!(
              initialData?.deposit_amount || initialData?.minimum_lease_duration
            )
          }
          propertyConditionPdf={propertyConditionPdf}
          onPdfChange={setPropertyConditionPdf}
        />

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

        {/* ═══ Actions ═══ */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {savedAt && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mr: 'auto', alignSelf: 'center' }}
            >
              Brouillon sauvegardé à{' '}
              {savedAt.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          )}
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={isSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || isCompressing}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
              py: 1.25,
            }}
          >
            {submitLabel}
          </Button>
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
