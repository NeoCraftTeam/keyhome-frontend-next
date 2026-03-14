'use client';

import { estimatorService } from '@/services/estimator.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { formatPrice } from '@/lib/constants';
import { Calculate, TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import {
  Alert,
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
  const [cityId, setCityId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [surface, setSurface] = useState(50);
  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined);
  const [enabled, setEnabled] = useState(false);

  const { data: cities } = useQuery({
    queryKey: ['cities-estimator'],
    queryFn: () => citiesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: types } = useQuery<import('@/types').AdType[]>({
    queryKey: ['types-estimator'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['rent-estimate', cityId, typeId, surface, bedrooms],
    queryFn: () => estimatorService.estimate({ city_id: cityId, type_id: typeId, surface, bedrooms }),
    enabled: enabled && !!cityId && !!typeId,
    staleTime: 60 * 60 * 1000,
  });

  const handleEstimate = () => setEnabled(true);

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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          select
          label="Ville"
          size="small"
          fullWidth
          value={cityId}
          onChange={(e) => { setCityId(e.target.value); setEnabled(false); }}
        >
          {cities?.data?.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>

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
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleEstimate}
          disabled={!cityId || !typeId || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Calculate />}
          fullWidth
        >
          {isLoading ? 'Calcul en cours...' : 'Estimer le loyer'}
        </Button>
      </Box>

      {data && !data.error && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" color="text.secondary" mb={2}>
            Fourchette estimée pour {surface} m²
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 1,
              textAlign: 'center',
            }}
          >
            {[
              { label: 'Bas du marché', value: data.estimated_min, icon: <TrendingDown color="success" /> },
              { label: 'Prix médian', value: data.estimated_median, icon: <TrendingFlat color="primary" />, highlight: true },
              { label: 'Haut du marché', value: data.estimated_max, icon: <TrendingUp color="error" /> },
            ].map(({ label, value, icon, highlight }) => (
              <Box
                key={label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: highlight ? 'primary.main' : 'action.hover',
                  color: highlight ? 'white' : 'text.primary',
                }}
              >
                {icon}
                <Typography variant="h6" fontWeight={700} fontSize={14}>
                  {formatPrice(value)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" mt={2} display="block" textAlign="center">
            Basé sur {data.sample_count} annonce(s) similaire(s)
          </Typography>
        </>
      )}

      {data?.error && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {data.error}
        </Alert>
      )}
    </Paper>
  );
}
