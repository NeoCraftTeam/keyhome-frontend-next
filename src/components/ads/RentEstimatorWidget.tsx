'use client';

import { Price } from '@/components/ui/typography/Price';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { adTypesService, citiesService } from '@/services/cities.service';
import { estimatorService } from '@/services/estimator.service';
import { AdType, City } from '@/types';
import Calculate from '@mui/icons-material/Calculate';
import TrendingDown from '@mui/icons-material/TrendingDown';
import TrendingFlat from '@mui/icons-material/TrendingFlat';
import TrendingUp from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';

function RentEstimatorWidget() {
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [typeId, setTypeId] = useState('');
  const [surface, setSurface] = useState(50);
  const [submittedParams, setSubmittedParams] = useState<{
    city_id: string;
    type_id: string;
    surface: number;
  } | null>(null);

  const { data: citiesData, isFetching: loadingCities } = useQuery({
    queryKey: ['cities-estimator', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 20 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: types } = useQuery<AdType[]>({
    queryKey: ['types-estimator'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const {
    data,
    isLoading: _isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      'rent-estimate',
      submittedParams?.city_id,
      submittedParams?.type_id,
      submittedParams?.surface,
    ],
    queryFn: () => estimatorService.estimate(submittedParams!),
    enabled: !!submittedParams,
    staleTime: 60 * 60 * 1000,
  });

  const canEstimate = !!selectedCity && !!typeId && !isFetching;

  const handleEstimate = () => {
    if (!selectedCity || !typeId) return;
    setSubmittedParams({ city_id: selectedCity.id, type_id: typeId, surface });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Calculate sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Estimateur de loyer
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Basé sur les annonces actives du marché
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* City autocomplete */}
        <Autocomplete<City>
          options={citiesData?.data ?? []}
          getOptionLabel={(c) => c.name}
          value={selectedCity}
          onChange={(_, val) => {
            setSelectedCity(val);
            setSubmittedParams(null);
          }}
          inputValue={cityInput}
          onInputChange={(_, val) => {
            setCityInput(val);
          }}
          loading={loadingCities}
          noOptionsText={
            cityInput.length < 1 ? 'Tapez une ville…' : 'Aucune ville trouvée'
          }
          slotProps={citySlotProps}
          renderOption={(props, option) => renderCityOption(props, option)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Ville"
              size="small"
              sx={cityInputSx}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCities ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Type select */}
        <TextField
          select
          label="Type de bien"
          size="small"
          fullWidth
          value={typeId}
          onChange={(e) => {
            setTypeId(e.target.value);
            setSubmittedParams(null);
          }}
        >
          {types?.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Surface slider */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Surface : <strong>{surface} m²</strong>
          </Typography>
          <Slider
            value={surface}
            onChange={(_, v) => {
              setSurface(v as number);
              setSubmittedParams(null);
            }}
            min={10}
            max={500}
            step={5}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v} m²`}
            color="primary"
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleEstimate}
          disabled={!canEstimate}
          startIcon={
            isFetching ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Calculate />
            )
          }
          fullWidth
          sx={{ py: 1.25, fontWeight: 700 }}
        >
          {isFetching ? 'Calcul en cours…' : 'Estimer le loyer'}
        </Button>
      </Box>

      {/* Results — wrapped in a polite live region so screen-reader
          users hear the new range without having to refocus the widget. */}
      {data && !data.error && (
        <Box
          role="region"
          aria-live="polite"
          aria-label="Résultats d'estimation de loyer"
        >
          <Divider sx={{ my: 3 }} />
          {data.type_scope_matched === false && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Peu d&apos;annonces pour ce type dans cette ville :
              l&apos;estimation s&apos;appuie sur l&apos;ensemble des locations
              publiées dans la ville.
            </Alert>
          )}
          {data.is_unreliable && (
            <Alert
              severity="info"
              sx={{ mb: 2, borderRadius: 2 }}
              role="status"
            >
              Estimation indicative — calculée sur seulement {data.sample_count}{' '}
              annonce
              {data.sample_count > 1 ? 's' : ''}. La fourchette peut être
              biaisée par un cas atypique.
            </Alert>
          )}
          <Typography variant="subtitle2" color="text.secondary" mb={2}>
            Fourchette estimée pour <strong>{surface} m²</strong> à{' '}
            <strong>{selectedCity?.name}</strong>
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
              gap: 1,
              textAlign: 'center',
            }}
          >
            {[
              {
                label: 'Bas du marché',
                value: data.estimated_min,
                icon: <TrendingDown color="success" />,
                highlight: false,
              },
              {
                label: 'Prix médian',
                value: data.estimated_median,
                icon: <TrendingFlat color="primary" />,
                highlight: true,
              },
              {
                label: 'Haut du marché',
                value: data.estimated_max,
                icon: <TrendingUp color="error" />,
                highlight: false,
              },
            ].map(({ label, value, icon, highlight }) => (
              <Box
                key={label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: highlight ? 'primary.main' : 'action.hover',
                  color: highlight ? 'white' : 'text.primary',
                  display: { xs: 'flex', sm: 'block' },
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 0 },
                }}
              >
                {icon}
                <Box sx={{ flex: { xs: 1, sm: 'unset' }, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    fontSize={13}
                    mt={{ xs: 0, sm: 0.5 }}
                  >
                    <Price amountXAF={value} />
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.75, fontSize: 10 }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            mt={2}
            display="block"
            textAlign="center"
          >
            Basé sur {data.sample_count} annonce
            {data.sample_count > 1 ? 's' : ''} similaire
            {data.sample_count > 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {data?.error && (
        // `role="alert"` so SR users hear "no data" immediately —
        // they wouldn't otherwise know the click did anything.
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }} role="alert">
          {data.error}
        </Alert>
      )}
    </Paper>
  );
}
export default memo(RentEstimatorWidget);
