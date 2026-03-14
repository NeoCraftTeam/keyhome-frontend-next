'use client';

import { estimatorService } from '@/services/estimator.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { formatPrice } from '@/lib/constants';
import { City, AdType } from '@/types';
import { Calculate, TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
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
import { useState } from 'react';

export default function RentEstimatorWidget() {
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [typeId, setTypeId] = useState('');
  const [surface, setSurface] = useState(50);
  const [enabled, setEnabled] = useState(false);

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

  const { data, isLoading } = useQuery({
    queryKey: ['rent-estimate', selectedCity?.id, typeId, surface],
    queryFn: () => estimatorService.estimate({
      city_id: selectedCity!.id,
      type_id: typeId,
      surface,
    }),
    enabled: enabled && !!selectedCity?.id && !!typeId,
    staleTime: 60 * 60 * 1000,
  });

  const canEstimate = !!selectedCity && !!typeId && !isLoading;

  const handleEstimate = () => {
    setEnabled(false);
    setTimeout(() => setEnabled(true), 50);
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
            width: 44, height: 44, borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Calculate sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>Estimateur de loyer</Typography>
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
          onChange={(_, val) => { setSelectedCity(val); setEnabled(false); }}
          inputValue={cityInput}
          onInputChange={(_, val) => { setCityInput(val); }}
          loading={loadingCities}
          noOptionsText={cityInput.length < 1 ? 'Tapez une ville…' : 'Aucune ville trouvée'}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Ville"
              size="small"
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
          onChange={(e) => { setTypeId(e.target.value); setEnabled(false); }}
        >
          {types?.map((t) => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </TextField>

        {/* Surface slider */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Surface : <strong>{surface} m²</strong>
          </Typography>
          <Slider
            value={surface}
            onChange={(_, v) => { setSurface(v as number); setEnabled(false); }}
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
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Calculate />}
          fullWidth
          sx={{ py: 1.25, fontWeight: 700 }}
        >
          {isLoading ? 'Calcul en cours…' : 'Estimer le loyer'}
        </Button>
      </Box>

      {/* Results */}
      {data && !data.error && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" color="text.secondary" mb={2}>
            Fourchette estimée pour <strong>{surface} m²</strong> à <strong>{selectedCity?.name}</strong>
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, textAlign: 'center' }}>
            {[
              { label: 'Bas du marché', value: data.estimated_min, icon: <TrendingDown color="success" />, highlight: false },
              { label: 'Prix médian', value: data.estimated_median, icon: <TrendingFlat color="primary" />, highlight: true },
              { label: 'Haut du marché', value: data.estimated_max, icon: <TrendingUp color="error" />, highlight: false },
            ].map(({ label, value, icon, highlight }) => (
              <Box
                key={label}
                sx={{
                  p: 1.5, borderRadius: 2,
                  bgcolor: highlight ? 'primary.main' : 'action.hover',
                  color: highlight ? 'white' : 'text.primary',
                }}
              >
                {icon}
                <Typography variant="h6" fontWeight={700} fontSize={13} mt={0.5}>
                  {formatPrice(value)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75, fontSize: 10 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" mt={2} display="block" textAlign="center">
            Basé sur {data.sample_count} annonce{data.sample_count > 1 ? 's' : ''} similaire{data.sample_count > 1 ? 's' : ''}
          </Typography>
        </>
      )}

      {data?.error && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          {data.error}
        </Alert>
      )}
    </Paper>
  );
}
