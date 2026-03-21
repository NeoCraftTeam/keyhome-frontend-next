'use client';

import {
  LocationOn as LocationIcon,
  AutoAwesome as AiIcon,
  ExpandMore as ExpandIcon,
  AddPhotoAlternate as Add360Icon,
  Delete as DeleteIcon,
  ViewInAr as TourIcon,
  Info as InfoIcon,
  RocketLaunch as BoostIcon,
  Home as HomeIcon,
  PhotoCamera as PhotoCameraIcon,
  Straighten as StraightenIcon,
  Bed as BedIcon,
  Shower as ShowerIcon,
  LocalParking as ParkingIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Map as MapIcon,
  Lightbulb as LightbulbIcon,
  // Property attribute icons
  Wifi as WifiIcon,
  Pool as PoolIcon,
  AcUnit as AcUnitIcon,
  Elevator as ElevatorIcon,
  Kitchen as KitchenIcon,
  Yard as YardIcon,
  Fireplace as FireplaceIcon,
  FitnessCenter as FitnessCenterIcon,
  Security as SecurityIcon,
  LocalLaundryService as LaundryServiceIcon,
  Tv as TvIcon,
  BalconyOutlined as BalconyIcon,
  WaterDrop as WaterDropIcon,
  ElectricBolt as ElectricBoltIcon,
  Garage as GarageIcon,
  DirectionsCar as DirectionsCarIcon,
  Bathtub as BathtubIcon,
  LocalBar as LocalBarIcon,
  LocalCafe as LocalCafeIcon,
  Deck as DeckIcon,
  Fence as FenceIcon,
  Alarm as AlarmIcon,
  Roofing as RoofingIcon,
  Spa as SpaIcon,
  SportsSoccer as SportsSoccerIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 300, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">Chargement de la carte...</Typography>
    </Box>
  ),
});
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
const AdTourHotspotEditor = dynamic(() => import('./AdTourHotspotEditor'), {
  ssr: false,
  loading: () => null,
});
import ImageLightbox from '@/components/ui/ImageLightbox';
import type { Ad, AdImage, AdType, City, Quarter, TourHotspot } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adTypesService, citiesService, quartersService } from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import { adsService } from '@/services/ads.service';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';

const DEFAULT_LAT = 4.0511;
const DEFAULT_LNG = 9.7679;

/** Curated map of attribute icon names (from the DB) → icon components. */
const ATTRIBUTE_ICON_MAP: Record<string, SvgIconComponent> = {
  Wifi: WifiIcon,
  Pool: PoolIcon,
  LocalParking: ParkingIcon,
  AcUnit: AcUnitIcon,
  Elevator: ElevatorIcon,
  Kitchen: KitchenIcon,
  Yard: YardIcon,
  Fireplace: FireplaceIcon,
  FitnessCenter: FitnessCenterIcon,
  Security: SecurityIcon,
  LocalLaundryService: LaundryServiceIcon,
  Tv: TvIcon,
  Balcony: BalconyIcon,
  BalconyOutlined: BalconyIcon,
  WaterDrop: WaterDropIcon,
  ElectricBolt: ElectricBoltIcon,
  Garage: GarageIcon,
  DirectionsCar: DirectionsCarIcon,
  Bathtub: BathtubIcon,
  Bed: BedIcon,
  Shower: ShowerIcon,
  LocalBar: LocalBarIcon,
  LocalCafe: LocalCafeIcon,
  Deck: DeckIcon,
  Fence: FenceIcon,
  Alarm: AlarmIcon,
  Roofing: RoofingIcon,
  Spa: SpaIcon,
  SportsSoccer: SportsSoccerIcon,
  CheckCircle: CheckCircleIcon,
  Lightbulb: LightbulbIcon,
};

const getAttributeIcon = (iconName?: string): SvgIconComponent => {
  if (!iconName) return CheckCircleOutlineIcon;
  const cleaned = iconName.replace(/^heroicon-[o-s]-/, '');
  return ATTRIBUTE_ICON_MAP[iconName] ?? ATTRIBUTE_ICON_MAP[cleaned] ?? CheckCircleOutlineIcon;
};

export interface AdFormValues {
  title: string;
  description: string;
  adresse: string;
  price: string;
  surface_area: string;
  bedrooms: string;
  bathrooms: string;
  has_parking: boolean;
  latitude: number;
  longitude: number;
  quarter_id: string;
  type_id: string;
  attributes: string[];
  // Premium info
  deposit_amount: string;
  minimum_lease_duration: string;
  charges_forfaitaires: boolean;
  charges_montant_forfait: string;
  charges_eau: string;
  charges_electricite: string;
  charges_autres: string;
  is_boost_requested?: boolean;
}

type AttributeOption = { value: string; label: string; group: string; icon?: string };

export interface TourScene {
  id?: string;
  title: string;
  file: File | null;
  previewUrl: string;
  hotspots: TourHotspot[];
}

const initialValues: AdFormValues = {
  title: '',
  description: '',
  adresse: '',
  price: '',
  surface_area: '',
  bedrooms: '0',
  bathrooms: '0',
  has_parking: false,
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  quarter_id: '',
  type_id: '',
  attributes: [],
  deposit_amount: '',
  minimum_lease_duration: '',
  charges_forfaitaires: false,
  charges_montant_forfait: '',
  charges_eau: '',
  charges_electricite: '',
  charges_autres: '',
};

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
    },
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
  submitLabel = 'Créer l\'annonce',
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
  const [propertyConditionPdf, setPropertyConditionPdf] = useState<File | null>(null);
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);

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

  // Fetch signed tour URLs so PanoramaViewer can load panoramas via the proxy.
  // The stored image_url values are unsigned — the API returns time-limited signed URLs.
  useEffect(() => {
    if (!ad?.id || !ad.has_3d_tour) return;
    let cancelled = false;

    adsService.getTour(ad.id).then((res) => {
      if (cancelled) return;
      const signedScenes = (res.config as { scenes?: Array<{ id: string; image_url?: string }> })?.scenes;
      if (!signedScenes?.length) return;

      setTourScenes((prev) =>
        prev.map((scene) => {
          if (scene.file) return scene;
          const signed = signedScenes.find((s) => s.id === scene.id);
          return signed?.image_url ? { ...scene, previewUrl: signed.image_url } : scene;
        }),
      );
    }).catch(() => {
      // Signed URL fetch failed — keep the unsigned URLs as fallback
    });

    return () => { cancelled = true; };
  }, [ad?.id, ad?.has_3d_tour]);

  const { slotProps: citySlotProps, renderOption: renderCityOption, inputSx: cityInputSx } = useCityAutocompleteConfig();

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
      })),
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
    [imagePreviewUrls, imagesToDelete, ad?.images],
  );

  const openPhotoLightbox = (index: number) => {
    setPhotoLightboxIndex(index);
    setPhotoLightboxOpen(true);
  };

  const update = (field: keyof AdFormValues, value: AdFormValues[keyof AdFormValues]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setErrors((prev) => ({ ...prev, images: 'Maximum 10 photos.' }));
      return;
    }
    const newImages = [...images, ...files];
    setImages(newImages);
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls((prev) => [...prev, ...newUrls]);
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

  // ── 3D Tour helpers ──
  const addTourScene = useCallback(() => {
    setTourScenes((prev) => [...prev, { id: `new-${Date.now()}`, title: '', file: null, previewUrl: '', hotspots: [] }]);
  }, []);

  const updateTourScene = useCallback((index: number, field: keyof TourScene, value: TourScene[keyof TourScene]) => {
    setTourScenes((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (field === 'file' && value instanceof File) {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
          return { ...s, file: value, previewUrl: URL.createObjectURL(value) };
        }
        return { ...s, [field]: value };
      }),
    );
  }, []);

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
    if (!values.description.trim()) e.description = 'La description est obligatoire.';
    if (!values.adresse.trim()) e.adresse = "L'adresse est obligatoire.";
    if (!values.price || parseFloat(values.price) < 0) e.price = 'Le prix est obligatoire.';
    if (!values.surface_area || parseFloat(values.surface_area) <= 0) e.surface_area = 'La surface est obligatoire.';
    if (parseInt(values.bedrooms, 10) < 0) e.bedrooms = 'Nombre de chambres invalide.';
    if (parseInt(values.bathrooms, 10) < 0) e.bathrooms = 'Nombre de salles de bain invalide.';
    if (!values.quarter_id) e.quarter_id = 'Le quartier est obligatoire.';
    if (!values.type_id) e.type_id = 'Le type d\'annonce est obligatoire.';
    // Validate tour scenes if any
    tourScenes.forEach((scene, i) => {
      if (!scene.title.trim()) e[`tour_scene_${i}_title`] = 'Nom de la pièce obligatoire.';
      if (!scene.file && !ad?.has_3d_tour) e[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
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
  };

  // ── Section styling constants ──
  const sectionSx = {
    p: { xs: 2, sm: 3 },
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  };

  const sectionTitleSx = {
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ═══ Section 1: Informations principales ═══ */}
        <Paper elevation={0} sx={sectionSx}>
            <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            Informations principales
          </Typography>
          <TextField
            fullWidth
            label="Titre de l'annonce"
            placeholder="Ex: Appartement 3 pièces vue mer — Bonanjo"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
          />
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              placeholder="Décrivez votre bien en détail : état, environnement, commodités à proximité…"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
            />
            {onEnhanceDescription && (
              <Button
                size="small"
                startIcon={enhancing ? <CircularProgress size={16} /> : <AiIcon />}
                onClick={handleEnhance}
                disabled={!values.description.trim() || enhancing}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
              >
                Améliorer avec l&apos;IA
              </Button>
            )}
          </Box>
        </Paper>

        {/* ═══ Section 2: Photos du bien ═══ */}
        <Paper elevation={0} sx={sectionSx}>
            <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            Photos du bien
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 'auto', fontWeight: 400 }}>
              max 10 — JPEG, PNG, WebP
            </Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
            {imagePreviewUrls.map((url, i) => (
              <Box
                key={i}
                onClick={() => lightboxImages.length > 0 && openPhotoLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (lightboxImages.length > 0 ? openPhotoLightbox(i) : null)}
                sx={{
                  position: 'relative',
                  width: 110,
                  height: 85,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: 'divider',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    width: 24,
                    height: 24,
                    '&:hover': { bgcolor: 'error.main' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
            {ad?.images
              ?.filter((img) => !imagesToDelete.includes(img.id))
              ?.map((img, idx) => (
                <Box
                  key={`existing-${img.id}`}
                  onClick={() => lightboxImages.length > 0 && openPhotoLightbox(imagePreviewUrls.length + idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (lightboxImages.length > 0 ? openPhotoLightbox(imagePreviewUrls.length + idx) : null)}
                  sx={{
                    position: 'relative',
                    width: 110,
                    height: 85,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'primary.light',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <img
                    src={img.thumb || img.url}
                    alt={ad.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setImagesToDelete((prev) => [...prev, img.id]); }}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: 'error.main' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            {(images.length +
              (ad?.images?.filter((img) => !imagesToDelete.includes(img.id))?.length ?? 0)) <
              10 && (
              <Button
                variant="outlined"
                component="label"
                sx={{
                  width: 110,
                  height: 85,
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" fontWeight={600}>+ Photo</Typography>
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
              </Button>
            )}
          </Box>
          {errors.images && (
            <Typography variant="caption" color="error">{errors.images}</Typography>
          )}
        </Paper>

        {/* ═══ Section 3: Quartier & Type ═══ */}
        <Paper elevation={0} sx={sectionSx}>
          <Typography variant="subtitle1" sx={sectionTitleSx}>
            <LocationIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            Localisation & Type
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={cities}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                value={selectedCity}
                inputValue={cityInput}
                onInputChange={(_, v) => setCityInput(v)}
                onChange={(_, v) => {
                  setSelectedCity(v);
                  setSelectedQuarter(null);
                  setQuarterInput('');
                  update('quarter_id', '');
                }}
                loading={isCitiesLoading}
                filterOptions={(x) => x}
                noOptionsText="Aucune ville"
                slotProps={citySlotProps}
                renderOption={(props, opt) => renderCityOption(props, opt)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ville"
                    placeholder="Rechercher une ville..."
                    sx={cityInputSx}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={quarters}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                value={selectedQuarter}
                inputValue={quarterInput}
                onInputChange={(_, v) => setQuarterInput(v)}
                onChange={(_, v) => {
                  setSelectedQuarter(v);
                  update('quarter_id', v?.id ?? '');
                }}
                loading={isQuartersLoading}
                filterOptions={(x) => x}
                noOptionsText="Aucun quartier"
                disabled={!selectedCity?.id}
                slotProps={citySlotProps}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    {opt.name} {opt.city_name ? `(${opt.city_name})` : ''}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Quartier"
                    placeholder="Sélectionnez d'abord une ville"
                    error={!!errors.quarter_id}
                    helperText={errors.quarter_id}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={!!errors.type_id}>
                <InputLabel>Type d&apos;annonce</InputLabel>
                <Select
                  value={values.type_id}
                  label="Type d'annonce"
                  onChange={(e) => update('type_id', e.target.value)}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {adTypes.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* ═══ Section 4: Caractéristiques ═══ */}
        <Paper elevation={0} sx={sectionSx}>
            <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StraightenIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            Caractéristiques
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Adresse"
                placeholder="Ex: Rue de la Liberté, Bonanjo"
                value={values.adresse}
                onChange={(e) => update('adresse', e.target.value)}
                error={!!errors.adresse}
                helperText={errors.adresse}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Prix (FCFA)"
                type="number"
                inputProps={{ min: 0, inputMode: 'numeric' }}
                value={values.price}
                onChange={(e) => update('price', e.target.value)}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₣</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Surface"
                type="number"
                inputProps={{ min: 1, inputMode: 'numeric' }}
                value={values.surface_area}
                onChange={(e) => update('surface_area', e.target.value)}
                error={!!errors.surface_area}
                helperText={errors.surface_area}
                InputProps={{
                  endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="Chambres"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                type="number"
                inputProps={{ min: 0, inputMode: 'numeric' }}
                value={values.bedrooms}
                onChange={(e) => update('bedrooms', e.target.value)}
                error={!!errors.bedrooms}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="SDB"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShowerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                type="number"
                inputProps={{ min: 0, inputMode: 'numeric' }}
                value={values.bathrooms}
                onChange={(e) => update('bathrooms', e.target.value)}
                error={!!errors.bathrooms}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.has_parking}
                    onChange={(e) => update('has_parking', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ParkingIcon sx={{ fontSize: 18 }} />
                    Parking
                  </Box>
                }
                sx={{ pt: 1 }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ═══ Section 5: Équipements ═══ */}
        {autocompleteOptions.length > 0 && (
          <Paper elevation={0} sx={sectionSx}>
            <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              Équipements & Services
            </Typography>
            <Autocomplete
              multiple
              options={autocompleteOptions}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.label}
              value={values.attributes
                .map((v) => autocompleteOptions.find((a) => a.value === v))
                .filter((a): a is AttributeOption => !!a)}
              onChange={(_, newValue) => {
                update('attributes', newValue.map((opt) => opt.value));
              }}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              renderOption={(props, option) => {
                const IconC = getAttributeIcon(option.icon);
                return (
                  <li {...props} key={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <IconC sx={{ fontSize: 20, color: 'text.secondary' }} />
                      {option.label}
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Rechercher et sélectionner des équipements…"
                  size="small"
                  label="Équipements"
                />
              )}
              sx={{ maxWidth: 420 }}
              slotProps={{ paper: { sx: { maxHeight: 320 } } }}
            />
          </Paper>
        )}

        {/* ═══ Section 6: Informations Premium ═══ */}
        <Accordion
          defaultExpanded={!!(initialData?.deposit_amount || initialData?.minimum_lease_duration)}
          sx={{
            borderRadius: '12px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              Informations Supplémentaires
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Détails supplémentaires pour votre bien — visibles par les locataires après déverrouillage.
            </Typography>

            {/* Conditions du bail */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              Conditions du bail
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dépôt de garantie</InputLabel>
                  <Select
                    value={values.deposit_amount}
                    label="Dépôt de garantie"
                    onChange={(e) => update('deposit_amount', e.target.value)}
                  >
                    <MenuItem value="">Non renseigné</MenuItem>
                    {['1 mois', '2 mois', '3 mois', '4 mois', '5 mois'].map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durée minimum du bail</InputLabel>
                  <Select
                    value={values.minimum_lease_duration}
                    label="Durée minimum du bail"
                    onChange={(e) => update('minimum_lease_duration', e.target.value)}
                  >
                    <MenuItem value="">Non renseigné</MenuItem>
                    {['6 mois', '1 an renouvelable', '2 ans renouvelable', '3 ans renouvelable'].map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Charges détaillées */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              Charges détaillées
            </Typography>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.charges_forfaitaires}
                    onChange={(e) => update('charges_forfaitaires', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Charges au forfait</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Activez si les charges sont un montant fixe mensuel (eau, électricité incluses)
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {values.charges_forfaitaires ? (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Montant forfaitaire mensuel"
                    placeholder="Ex: 25 000"
                    type="number"
                    inputProps={{ min: 0, inputMode: 'numeric' }}
                    value={values.charges_montant_forfait}
                    onChange={(e) => update('charges_montant_forfait', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">FCFA</InputAdornment>,
                    }}
                  />
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Frais d'eau (mensuel)"
                      placeholder="Ex: 10 000"
                      type="number"
                      inputProps={{ min: 0, inputMode: 'numeric' }}
                      value={values.charges_eau}
                      onChange={(e) => update('charges_eau', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">FCFA</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Frais d'électricité (mensuel)"
                      placeholder="Ex: 15 000"
                      type="number"
                      inputProps={{ min: 0, inputMode: 'numeric' }}
                      value={values.charges_electricite}
                      onChange={(e) => update('charges_electricite', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">FCFA</InputAdornment>,
                      }}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Autres charges"
                  placeholder="Ex: Gardiennage: 5 000 FCFA/mois, Ordures: 2 000 FCFA/mois"
                  multiline
                  rows={2}
                  value={values.charges_autres}
                  onChange={(e) => update('charges_autres', e.target.value)}
                />
              </Grid>
            </Grid>

            {/* État des lieux PDF */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
              État des lieux
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {propertyConditionPdf ? propertyConditionPdf.name : 'Choisir un PDF'}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setPropertyConditionPdf(e.target.files?.[0] ?? null)}
                />
              </Button>
              {propertyConditionPdf && (
                <IconButton size="small" onClick={() => setPropertyConditionPdf(null)}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
              <Typography variant="caption" color="text.secondary">
                PDF, max 10 Mo
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* ═══ Section 7: Visite Virtuelle 3D ═══ */}
        <Accordion
          defaultExpanded={!!(ad?.has_3d_tour)}
          sx={{
            borderRadius: '12px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TourIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              Visite Virtuelle 3D
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Offrez à vos locataires une immersion complète dans votre bien.
            </Typography>

            {/* Guide collapsible */}
            <Accordion
              sx={{
                mb: 2.5,
                borderRadius: '8px !important',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="body2" fontWeight={600}>
                  📱 Comment prendre vos photos 360° ?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      🤖 Android — Google Camera (Recommandé)
                    </Typography>
                    <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
                      <li>Téléchargez <strong>Google Camera</strong> depuis le Play Store</li>
                      <li>Appuyez sur <strong>Plus</strong> → <strong>Photo Sphere</strong></li>
                      <li>Placez-vous <strong>au centre exact</strong> de la pièce</li>
                      <li>Suivez les cercles blancs en tournant <strong>lentement</strong> à 360°</li>
                    </Typography>
                  </Alert>

                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LightbulbIcon sx={{ fontSize: 18 }} /> iPhone (iOS 14+)
                    </Typography>
                    <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
                      <li>App <strong>Appareil Photo</strong> → mode <strong>Panorama</strong></li>
                      <li>Faites un panorama <strong>complet à 360°</strong></li>
                      <li>Alternative : app <strong>Panorama 360</strong> sur l&apos;App Store</li>
                    </Typography>
                  </Alert>

                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LightbulbIcon sx={{ fontSize: 18 }} />
                      Conseils
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                      <li>Prenez vos photos en <strong>pleine lumière</strong></li>
                      <li>Placez-vous au <strong>centre exact</strong> de chaque pièce</li>
                      <li>Faites <strong>une photo par pièce</strong></li>
                      <li>Format : <strong>JPG ou WEBP</strong>, max <strong>30 Mo</strong></li>
                    </Typography>
                  </Alert>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Existing tour indicator */}
            {ad?.has_3d_tour && tourScenes.length === 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Ce bien possède déjà un tour 3D avec {ad.tour_scenes_count ?? '?'} scènes.
                Ajoutez de nouvelles scènes ci-dessous pour les ajouter au tour existant.
              </Alert>
            )}

            {/* Scene list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              {tourScenes.map((scene, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: errors[`tour_scene_${i}_title`] || errors[`tour_scene_${i}_file`] ? 'error.main' : 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    alignItems: { sm: 'center' },
                  }}
                >
                  {/* Preview */}
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 120 },
                      minHeight: 80,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {scene.previewUrl ? (
                      <img
                        src={scene.previewUrl}
                        alt={scene.title || `Scène ${i + 1}`}
                        style={{ width: '100%', height: 80, objectFit: 'cover' }}
                      />
                    ) : (
                      <Button
                        variant="text"
                        component="label"
                        size="small"
                        sx={{ textTransform: 'none', color: 'text.secondary', flexDirection: 'column', gap: 0.5 }}
                      >
                        <Add360Icon sx={{ fontSize: 28 }} />
                        <Typography variant="caption">Photo 360°</Typography>
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) updateTourScene(i, 'file', f);
                          }}
                        />
                      </Button>
                    )}
                  </Box>

                  {/* Fields */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      size="small"
                      label="Nom de la pièce"
                      placeholder="Ex: Salon, Chambre parentale..."
                      value={scene.title}
                      onChange={(e) => updateTourScene(i, 'title', e.target.value)}
                      error={!!errors[`tour_scene_${i}_title`]}
                      helperText={errors[`tour_scene_${i}_title`]}
                      fullWidth
                    />
                    {scene.previewUrl && (
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 1.5 }}
                      >
                        Changer la photo
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) updateTourScene(i, 'file', f);
                          }}
                        />
                      </Button>
                    )}
                    {errors[`tour_scene_${i}_file`] && (
                      <Typography variant="caption" color="error">{errors[`tour_scene_${i}_file`]}</Typography>
                    )}

                    {/* Hotspots Editor */}
                    <AdTourHotspotEditor
                      scene={scene}
                      allScenes={tourScenes}
                      onUpdateHotspots={(hotspots: TourHotspot[]) => updateTourScene(i, 'hotspots', hotspots)}
                    />
                  </Box>

                  {/* Delete */}
                  <IconButton
                    onClick={() => removeTourScene(i)}
                    size="small"
                    sx={{ color: 'text.secondary', alignSelf: { xs: 'flex-end', sm: 'center' } }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              ))}
            </Box>

            <Button
              variant="outlined"
              startIcon={<Add360Icon />}
              onClick={addTourScene}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                borderStyle: 'dashed',
                fontWeight: 600,
              }}
            >
              Ajouter une pièce
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* ═══ Section 9: Options de visibilité (Boost) ═══ */}
        <Paper
          elevation={0}
          sx={{
            ...sectionSx,
            border: '2px solid',
            borderColor: 'rgba(246, 71, 95, 0.2)',
            bgcolor: 'rgba(246, 71, 95, 0.02)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <BoostIcon sx={{ color: '#F6475F' }} />
            <Typography variant="subtitle1" fontWeight={800} color="#F6475F">
              Booster cette annonce (Recommandé)
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Positionnez votre annonce en tête des résultats dès sa publication pour attirer 3x plus de locataires.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="body1" fontWeight={700}>Activer le Boost Standard</Typography>
              <Typography variant="caption" color="text.secondary">Remontée quotidienne pendant 3 jours · 1 500 FCFA</Typography>
            </Box>
            <Switch
              color="primary"
              checked={values.is_boost_requested || false}
              onChange={(e) => update('is_boost_requested', e.target.checked)}
            />
          </Box>
        </Paper>

        {/* ═══ Section 8: Localisation carte ═══ */}
        <Paper elevation={0} sx={sectionSx}>
          <Typography variant="subtitle1" sx={sectionTitleSx}>
            <MapIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            Position sur la carte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Positionnez votre bien sur la carte pour que les locataires puissent le localiser facilement.
          </Typography>
          <MapPicker
            latitude={values.latitude !== DEFAULT_LAT ? values.latitude : null}
            longitude={values.longitude !== DEFAULT_LNG ? values.longitude : null}
            onLocationChange={(lat, lng) => {
              update('latitude', lat);
              update('longitude', lng);
            }}
            height={320}
          />
        </Paper>

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
          {onCancel && (
            <Button onClick={onCancel} disabled={isSubmitting} sx={{ borderRadius: 2 }}>
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
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
