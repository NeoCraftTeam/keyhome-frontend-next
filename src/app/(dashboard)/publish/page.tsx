'use client';

import { useAuth } from '@/providers/AuthProvider';
import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService, quartersService } from '@/services/cities.service';
import { PropertyAttribute } from '@/types';
import {
  AddPhotoAlternate,
  Apartment,
  ArrowBack,
  ArrowForward,
  Check,
  Close,
  Home,
  LocationOn,
  MyLocation,
  Wifi,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Slider,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/constants';

mapboxgl.accessToken = MAPBOX_TOKEN;

const STEPS = ['Informations', 'Détails & Prix', 'Localisation', 'Photos', 'Confirmation'];

const ATTRIBUTE_LABELS: Record<PropertyAttribute, string> = {
  [PropertyAttribute.Wifi]: 'Wi-Fi',
  [PropertyAttribute.AirConditioning]: 'Climatisation',
  [PropertyAttribute.Heating]: 'Chauffage',
  [PropertyAttribute.PetsAllowed]: 'Animaux acceptés',
  [PropertyAttribute.Furnished]: 'Meublé',
  [PropertyAttribute.Pool]: 'Piscine',
  [PropertyAttribute.Garden]: 'Jardin',
  [PropertyAttribute.Balcony]: 'Balcon',
  [PropertyAttribute.Terrace]: 'Terrasse',
  [PropertyAttribute.Elevator]: 'Ascenseur',
  [PropertyAttribute.Security]: 'Sécurité',
  [PropertyAttribute.Gym]: 'Salle de sport',
  [PropertyAttribute.Laundry]: 'Buanderie',
  [PropertyAttribute.Storage]: 'Rangement',
  [PropertyAttribute.Fireplace]: 'Cheminée',
  [PropertyAttribute.Dishwasher]: 'Lave-vaisselle',
  [PropertyAttribute.WashingMachine]: 'Lave-linge',
  [PropertyAttribute.Tv]: 'Télévision',
  [PropertyAttribute.Accessibility]: 'Accessibilité PMR',
  [PropertyAttribute.SmokingAllowed]: 'Fumeurs acceptés',
};

interface FormData {
  title: string;
  description: string;
  type_id: string;
  city_id: string;
  quarter_id: string;
  adresse: string;
  price: string;
  surface_area: string;
  bedrooms: string;
  bathrooms: string;
  has_parking: boolean;
  attributes: PropertyAttribute[];
  latitude: string;
  longitude: string;
  available_from: string;
  deposit_amount: string;
}

const initialForm: FormData = {
  title: '',
  description: '',
  type_id: '',
  city_id: '',
  quarter_id: '',
  adresse: '',
  price: '',
  surface_area: '',
  bedrooms: '0',
  bathrooms: '0',
  has_parking: false,
  attributes: [],
  latitude: '',
  longitude: '',
  available_from: '',
  deposit_amount: '',
};

export default function PublishPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const { data: citiesData } = useQuery({
    queryKey: ['cities-publish'],
    queryFn: () => citiesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: quartersData } = useQuery({
    queryKey: ['quarters-publish', form.city_id],
    queryFn: () => quartersService.list({ city_id: form.city_id }),
    enabled: !!form.city_id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: typesData } = useQuery<import('@/types').AdType[]>({
    queryKey: ['ad-types-publish'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  // Redirect if not agent/admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'customer') {
      router.replace('/home');
    }
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Init Mapbox on step 2
  useEffect(() => {
    if (step !== 2 || !mapContainerRef.current || mapRef.current) { return; }

    const center: [number, number] = form.longitude && form.latitude
      ? [parseFloat(form.longitude), parseFloat(form.latitude)]
      : DEFAULT_CENTER;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    const marker = new mapboxgl.Marker({ color: '#F6475F', draggable: true })
      .setLngLat(center)
      .addTo(map);

    markerRef.current = marker;

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setForm((f) => ({ ...f, latitude: String(lngLat.lat), longitude: String(lngLat.lng) }));
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      setForm((f) => ({ ...f, latitude: String(e.lngLat.lat), longitude: String(e.lngLat.lng) }));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [step]);

  const handleGeolocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setForm((f) => ({ ...f, latitude: String(latitude), longitude: String(longitude) }));
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
      markerRef.current?.setLngLat([longitude, latitude]);
    });
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - images.length;
    const toAdd = files.slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }, [images]);

  const removeImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const toggleAttribute = useCallback((attr: PropertyAttribute) => {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.includes(attr)
        ? f.attributes.filter((a) => a !== attr)
        : [...f.attributes, attr],
    }));
  }, []);

  const canProceed = (): boolean => {
    if (step === 0) {
      return !!(form.title.trim() && form.type_id && form.city_id && form.quarter_id);
    }
    if (step === 1) {
      return !!(form.price && form.surface_area);
    }
    if (step === 2) {
      return !!(form.adresse.trim());
    }
    if (step === 3) {
      return images.length >= 1;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type_id', form.type_id);
      fd.append('quarter_id', form.quarter_id);
      fd.append('adresse', form.adresse);
      fd.append('price', form.price);
      fd.append('surface_area', form.surface_area);
      fd.append('bedrooms', form.bedrooms);
      fd.append('bathrooms', form.bathrooms);
      fd.append('has_parking', form.has_parking ? '1' : '0');
      if (form.latitude && form.longitude) {
        fd.append('latitude', form.latitude);
        fd.append('longitude', form.longitude);
      }
      if (form.available_from) { fd.append('available_from', form.available_from); }
      if (form.deposit_amount) { fd.append('deposit_amount', form.deposit_amount); }
      form.attributes.forEach((a) => fd.append('attributes[]', a));
      images.forEach((img) => fd.append('images[]', img));

      await adsService.create(fd);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Check sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Annonce soumise avec succès !
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Votre annonce est en cours de validation par notre équipe. Vous serez notifié dès qu'elle sera publiée.
        </Typography>
        <Button variant="contained" onClick={() => router.push('/home')} size="large">
          Retour à l'accueil
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Publier une annonce
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Remplissez les informations pour mettre votre bien en ligne.
      </Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 5 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <LinearProgress
        variant="determinate"
        value={((step + 1) / STEPS.length) * 100}
        sx={{ mb: 4, height: 6, borderRadius: 3 }}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        {/* STEP 0 — Informations de base */}
        {step === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
              <Home color="primary" /> Informations générales
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  label="Titre de l'annonce *"
                  fullWidth
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  inputProps={{ maxLength: 120 }}
                  helperText={`${form.title.length}/120 — Ex : Bel appartement 3 pièces à Bastos`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Type de bien *"
                  fullWidth
                  value={form.type_id}
                  onChange={(e) => setForm((f) => ({ ...f, type_id: e.target.value }))}
                >
                  {typesData?.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Ville *"
                  fullWidth
                  value={form.city_id}
                  onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value, quarter_id: '' }))}
                >
                  {citiesData?.data?.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  select
                  label="Quartier *"
                  fullWidth
                  value={form.quarter_id}
                  onChange={(e) => setForm((f) => ({ ...f, quarter_id: e.target.value }))}
                  disabled={!form.city_id}
                >
                  {quartersData?.data?.map((q) => (
                    <MenuItem key={q.id} value={q.id}>{q.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  helperText="Décrivez votre bien : état, environnement, accès, points forts... Une description détaillée augmente vos chances de location."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 1 — Détails & Prix */}
        {step === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
              <Apartment color="primary" /> Détails & Prix
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Prix mensuel (FCFA) *"
                  fullWidth
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">FCFA/mois</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Surface (m²) *"
                  fullWidth
                  type="number"
                  value={form.surface_area}
                  onChange={(e) => setForm((f) => ({ ...f, surface_area: e.target.value }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">m²</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography gutterBottom>Chambres : {form.bedrooms}</Typography>
                <Slider
                  value={parseInt(form.bedrooms)}
                  onChange={(_, v) => setForm((f) => ({ ...f, bedrooms: String(v) }))}
                  min={0} max={10} step={1} marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography gutterBottom>Salles de bain : {form.bathrooms}</Typography>
                <Slider
                  value={parseInt(form.bathrooms)}
                  onChange={(_, v) => setForm((f) => ({ ...f, bathrooms: String(v) }))}
                  min={0} max={6} step={1} marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.has_parking}
                      onChange={(e) => setForm((f) => ({ ...f, has_parking: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Parking inclus"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Caution (FCFA)"
                  fullWidth
                  type="number"
                  value={form.deposit_amount}
                  onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Disponible à partir du"
                  fullWidth
                  type="date"
                  value={form.available_from}
                  onChange={(e) => setForm((f) => ({ ...f, available_from: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Équipements & services
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.values(PropertyAttribute).map((attr) => (
                    <Chip
                      key={attr}
                      label={ATTRIBUTE_LABELS[attr]}
                      onClick={() => toggleAttribute(attr)}
                      color={form.attributes.includes(attr) ? 'primary' : 'default'}
                      variant={form.attributes.includes(attr) ? 'filled' : 'outlined'}
                      icon={<Wifi sx={{ fontSize: 16 }} />}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2 — Localisation */}
        {step === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
              <LocationOn color="primary" /> Localisation
            </Typography>
            <TextField
              label="Adresse précise *"
              fullWidth
              value={form.adresse}
              onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
              helperText="Ex : Rue Nachtigal, face au supermarché Score"
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Latitude"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Longitude"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
              />
              <Tooltip title="Utiliser ma position">
                <IconButton onClick={handleGeolocate} color="primary">
                  <MyLocation />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" mb={2} display="block">
              Cliquez sur la carte ou déplacez le marqueur pour définir la position exacte.
            </Typography>
            <Box
              ref={mapContainerRef}
              sx={{ height: 350, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
            />
          </Box>
        )}

        {/* STEP 3 — Photos */}
        {step === 3 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={1} display="flex" alignItems="center" gap={1}>
              <AddPhotoAlternate color="primary" /> Photos
            </Typography>
            <Typography color="text.secondary" mb={3}>
              Ajoutez jusqu'à 10 photos. La première sera la photo principale.
            </Typography>

            {images.length < 10 && (
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternate />}
                sx={{ mb: 3, borderStyle: 'dashed', py: 2, px: 4 }}
                fullWidth
              >
                Ajouter des photos ({images.length}/10)
                <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
              </Button>
            )}

            <Grid container spacing={2}>
              {imagePreviews.map((src, idx) => (
                <Grid key={idx} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '4/3' }}>
                    <Box
                      component="img"
                      src={src}
                      alt={`Photo ${idx + 1}`}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {idx === 0 && (
                      <Chip
                        label="Principale"
                        size="small"
                        color="primary"
                        sx={{ position: 'absolute', top: 6, left: 6 }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeImage(idx)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {images.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Au moins 1 photo est requise. Les annonces avec 5+ photos reçoivent 3× plus de contacts.
              </Alert>
            )}
          </Box>
        )}

        {/* STEP 4 — Récapitulatif */}
        {step === 4 && (
          <Box>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Récapitulatif
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Titre', value: form.title },
              { label: 'Type', value: typesData?.find((t) => t.id === form.type_id)?.name ?? '—' },
              { label: 'Quartier', value: quartersData?.data?.find((q) => q.id === form.quarter_id)?.name ?? '—' },
                { label: 'Prix', value: form.price ? `${parseInt(form.price).toLocaleString('fr-FR')} FCFA/mois` : '—' },
                { label: 'Surface', value: form.surface_area ? `${form.surface_area} m²` : '—' },
                { label: 'Chambres', value: form.bedrooms },
                { label: 'Parking', value: form.has_parking ? 'Oui' : 'Non' },
                { label: 'Photos', value: `${images.length} photo(s)` },
                { label: 'Localisation GPS', value: form.latitude ? 'Définie' : 'Non définie' },
              ].map(({ label, value }) => (
                <Grid key={label} size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography fontWeight={600}>{value}</Typography>
                </Grid>
              ))}
            </Grid>

            {form.attributes.length > 0 && (
              <Box mt={3}>
                <Typography variant="caption" color="text.secondary">Équipements</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {form.attributes.map((a) => (
                    <Chip key={a} label={ATTRIBUTE_LABELS[a]} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          Précédent
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            size="large"
          >
            Suivant
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={submitting}
            size="large"
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Check />}
          >
            {submitting ? 'Publication...' : 'Publier l\'annonce'}
          </Button>
        )}
      </Box>
    </Container>
  );
}
