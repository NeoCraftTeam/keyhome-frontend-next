'use client';

import api from '@/lib/api';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { City } from '@/types';
import { AutoAwesome, LocationOn, Search as SearchIcon } from '@mui/icons-material';
import {
  alpha,
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const EXAMPLES = [
  'Appartement 3 pièces à Bastos moins de 150 000 FCFA',
  'Villa avec piscine à Douala Bonapriso',
  'Studio meublé à Yaoundé avec parking',
];

interface Props {
  cities: City[];
  cityInput: string;
  setCityInput: (v: string) => void;
  isCitiesLoading: boolean;
  onCitySelect: (event: React.SyntheticEvent, city: City | null) => void;
}

export default function HeroSearch({ cities, cityInput, setCityInput, isCitiesLoading, onCitySelect }: Props) {
  const theme = useTheme();
  const { slotProps: citySlotProps, renderOption: renderCityOption } = useCityAutocompleteConfig();
  const [tab, setTab] = useState(0);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleAiSearch = async (q?: string) => {
    const searchQuery = q ?? aiQuery;
    if (!searchQuery.trim()) { return; }
    setAiLoading(true);
    try {
      const res = await api.post('/search/parse', { q: searchQuery });
      const parsed = res.data;
      const params = new URLSearchParams();
      if (parsed.q) { params.set('q', parsed.q); }
      if (parsed.city_name) { params.set('city', parsed.city_name); }
      if (parsed.type_name) { params.set('type', parsed.type_name); }
      if (parsed.bedrooms) { params.set('bedrooms', String(parsed.bedrooms)); }
      if (parsed.price_max) { params.set('price_max', String(parsed.price_max)); }
      if (parsed.price_min) { params.set('price_min', String(parsed.price_min)); }
      if (parsed.surface_min) { params.set('surface_min', String(parsed.surface_min)); }
      if (parsed.has_parking) { params.set('parking', '1'); }
      startTransition(() => { router.push(`/search?${params.toString()}`); });
    } catch {
      // fallback: simple text search
      startTransition(() => { router.push(`/search?q=${encodeURIComponent(searchQuery)}`); });
    } finally {
      setAiLoading(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';
  const isDropdownOpen = cityInput.length >= 2 && cities.length > 0;
  const inputSx = {
    bgcolor: isDark ? theme.palette.background.paper : '#F8F7F5',
    borderRadius: 0,
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      fontSize: { xs: '0.9rem', md: '1rem' },
      pr: '14px !important',
      minHeight: { xs: 54, md: 52 },
      color: 'text.primary',
      '&.Mui-focused': {
        boxShadow: 'none !important',
        outline: 'none',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderWidth: 0,
      },
      '& .MuiInputBase-input': {
        color: 'text.primary',
        '&:focus': { outline: 'none' },
      },
      '& .MuiInputBase-input::placeholder': {
        color: 'text.secondary',
        opacity: 1,
      },
    },
    '& fieldset': { border: 'none' },
    boxShadow: 'none',
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 580 }, mx: { xs: 'auto', md: 0 } }}>
      {/* Mode tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 1.5,
          minHeight: 32,
          '& .MuiTab-root': {
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            fontSize: '0.8rem',
            minHeight: 32,
            py: 0.5,
            px: 1.5,
            textTransform: 'none',
          },
          '& .Mui-selected': { color: 'white !important' },
          '& .MuiTabs-indicator': { bgcolor: 'white', height: 2, borderRadius: 1 },
        }}
      >
        <Tab icon={<LocationOn sx={{ fontSize: 14 }} />} iconPosition="start" label="Par ville" />
        <Tab icon={<AutoAwesome sx={{ fontSize: 14 }} />} iconPosition="start" label="Recherche IA" />
      </Tabs>

      {/* Tab 0 — City search */}
      {tab === 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            borderRadius: isDropdownOpen ? '16px 16px 0 0' : 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDropdownOpen ? alpha(theme.palette.primary.main, 0.4) : 'divider',
            bgcolor: isDark ? theme.palette.background.paper : '#F8F7F5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            transition: 'border-color 0.2s',
          }}
        >
          <Autocomplete<City>
            options={cities}
            forcePopupIcon={false}
            getOptionLabel={(opt) => opt.name}
            filterOptions={(x) => x}
            loading={isCitiesLoading}
            inputValue={cityInput}
            onInputChange={(_, val) => setCityInput(val)}
            onChange={onCitySelect}
            noOptionsText={null}
            open={isDropdownOpen}
            slotProps={citySlotProps}
            renderOption={(props, option) => renderCityOption(props, option)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Ville, quartier…"
                sx={inputSx}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {isCitiesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ width: '100%' }}
          />
        </Box>
      )}

      {/* Tab 1 — AI natural language search */}
      {tab === 1 && (
        <Box>
          <TextField
            fullWidth
            placeholder="Ex: Appartement 3 pièces à Bastos moins de 150 000 FCFA…"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleAiSearch(); } }}
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AutoAwesome sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {aiLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Recherche…
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label="Lancer la recherche IA"
                      onClick={() => handleAiSearch()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAiSearch(); } }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        mr: 0.5,
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                      }}
                    >
                      <SearchIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                  )}
                </InputAdornment>
              ),
            }}
          />
          {/* Example chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
            {EXAMPLES.map((ex) => (
              <Box
                key={ex}
                role="button"
                tabIndex={0}
                aria-label={`Rechercher : ${ex}`}
                onClick={() => { setAiQuery(ex); handleAiSearch(ex); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAiQuery(ex); handleAiSearch(ex); } }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 99,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: { xs: 10, sm: 11 },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'scale(1.02)' },
                  '&:active': { transform: 'scale(0.98)' },
                  '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
                }}
              >
                {ex}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
