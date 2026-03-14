'use client';

import api from '@/lib/api';
import { City } from '@/types';
import { AutoAwesome, LocationOn, Search as SearchIcon } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
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
      if (parsed.type_name) { params.set('type_name', parsed.type_name); }
      if (parsed.bedrooms) { params.set('bedrooms', String(parsed.bedrooms)); }
      if (parsed.price_max) { params.set('price_max', String(parsed.price_max)); }
      if (parsed.price_min) { params.set('price_min', String(parsed.price_min)); }
      if (parsed.has_parking) { params.set('parking', '1'); }
      startTransition(() => { router.push(`/search?${params.toString()}`); });
    } catch {
      // fallback: simple text search
      startTransition(() => { router.push(`/search?q=${encodeURIComponent(searchQuery)}`); });
    } finally {
      setAiLoading(false);
    }
  };

  const inputSx = {
    bgcolor: 'background.paper',
    borderRadius: '12px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '999px',
      fontSize: { xs: '0.9rem', md: '1rem' },
      pr: '14px !important',
      minHeight: { xs: 54, md: 52 },
    },
    '& fieldset': { border: 'none' },
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
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
          '& .Mui-selected': { color: '#fff !important' },
          '& .MuiTabs-indicator': { bgcolor: '#fff', height: 2, borderRadius: 1 },
        }}
      >
        <Tab icon={<LocationOn sx={{ fontSize: 14 }} />} iconPosition="start" label="Par ville" />
        <Tab icon={<AutoAwesome sx={{ fontSize: 14 }} />} iconPosition="start" label="Recherche IA ✨" />
      </Tabs>

      {/* Tab 0 — City search */}
      {tab === 0 && (
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
          open={cityInput.length >= 2 && cities.length > 0}
          slotProps={{
            paper: {
              sx: {
                borderRadius: '14px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'divider',
                mt: 1,
                overflow: 'hidden',
              },
            },
            listbox: {
              sx: {
                py: 0.5,
                '& .MuiAutocomplete-option': {
                  px: 2.5,
                  py: 1.5,
                  gap: 1.5,
                  fontSize: '0.9rem',
                  '&[aria-selected="true"]': { bgcolor: 'rgba(246,71,95,0.08)', color: 'primary.main', fontWeight: 600 },
                  '&.Mui-focused': { bgcolor: 'rgba(246,71,95,0.06)' },
                },
              },
            },
          }}
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props}>
              <LocationOn sx={{ fontSize: 16, color: 'text.disabled', mr: 0.5 }} />
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Entrez une ville, un quartier…"
              sx={inputSx}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {isCitiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ width: '100%' }}
        />
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
                    <CircularProgress size={20} />
                  ) : (
                    <Box
                      onClick={() => handleAiSearch()}
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
                onClick={() => { setAiQuery(ex); handleAiSearch(ex); }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 99,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
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
