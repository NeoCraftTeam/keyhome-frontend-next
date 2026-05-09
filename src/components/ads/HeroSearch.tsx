'use client';

import { type ParsedSearchParams } from '@/components/search/ImageSearchButton';
import VoiceSearchButton from '@/components/search/VoiceSearchButton';
import api from '@/lib/api';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { buildNlpParams } from '@/lib/nlp-search';
import { useCurrency } from '@/providers/CurrencyProvider';
import { City } from '@/types';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import LocationOn from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
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
import { motion, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

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
  onGeolocate?: () => void;
  geolocating?: boolean;
}

export default function HeroSearch({
  cities,
  cityInput,
  setCityInput,
  isCitiesLoading,
  onCitySelect,
  onGeolocate,
  geolocating,
}: Props) {
  const theme = useTheme();
  const { slotProps: citySlotProps, renderOption: renderCityOption } =
    useCityAutocompleteConfig();
  const [tab, setTab] = useState(0);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFocused, setAiFocused] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { currency } = useCurrency();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const aiBoxControls = useAnimation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);
  const prevAiLen = useRef(0);
  const isAiActive = aiFocused || aiQuery.length > 0;

  useEffect(() => {
    const len = aiQuery.length;
    const prev = prevAiLen.current;
    prevAiLen.current = len;

    if (len === 0) {
      setIsMultiline(false);
      return;
    }

    const el = inputRef.current;
    if (!isMultiline && el && el.scrollWidth > el.clientWidth) {
      setIsMultiline(true);
      void aiBoxControls.start({
        y: [0, -9, 4, -2, 0],
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    } else if (prev === 0) {
      void aiBoxControls.start({
        y: [0, -7, 3, -1.5, 0],
        transition: { duration: 0.55, ease: 'easeOut' },
      });
    }
  }, [aiQuery, aiBoxControls, isMultiline]);

  const navigateFromParsed = useCallback(
    (parsed: ParsedSearchParams) => {
      startTransition(() =>
        router.push(`/search?${buildNlpParams(parsed).toString()}`)
      );
    },
    [router, startTransition]
  );

  const handleAiSearch = async (q?: string) => {
    const searchQuery = q ?? aiQuery;
    if (!searchQuery.trim()) {
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.post('/search/parse', {
        q: searchQuery,
        display_currency: currency,
      });
      navigateFromParsed(res.data as ParsedSearchParams);
    } catch {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSearchRef = useRef(handleAiSearch);
  handleAiSearchRef.current = handleAiSearch;

  const handleVoice = useCallback((transcript: string) => {
    setAiQuery(transcript);
    void handleAiSearchRef.current(transcript);
  }, []);

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
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 580 },
        mx: { xs: 'auto', md: 0 },
      }}
    >
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
          '& .MuiTabs-indicator': {
            bgcolor: 'white',
            height: 2,
            borderRadius: 1,
          },
        }}
      >
        <Tab
          icon={<LocationOn sx={{ fontSize: 14 }} />}
          iconPosition="start"
          label="Par ville"
        />
        <Tab
          icon={<AutoAwesome sx={{ fontSize: 14 }} />}
          iconPosition="start"
          label="Recherche IA"
        />
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
            borderColor: isDropdownOpen
              ? alpha(theme.palette.primary.main, 0.4)
              : 'divider',
            bgcolor: isDark ? theme.palette.background.paper : '#F8F7F5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            transition: 'border-color 0.2s',
          }}
        >
          {onGeolocate && (
            <Box
              role="button"
              tabIndex={0}
              aria-label="Rechercher autour de moi"
              onClick={onGeolocate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onGeolocate();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                flexShrink: 0,
                cursor: geolocating ? 'wait' : 'pointer',
                borderRight: '1px solid',
                borderColor: 'divider',
                color: 'primary.main',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                transition: 'background-color 0.2s',
              }}
            >
              {geolocating ? (
                <CircularProgress size={18} color="primary" />
              ) : (
                <MyLocationIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
          )}
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
                      <SearchIcon
                        sx={{ color: 'text.secondary', fontSize: 19 }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {isCitiesLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
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
          <motion.div animate={aiBoxControls} style={{ width: '100%' }}>
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: isDark ? theme.palette.background.paper : '#F8F7F5',
                boxShadow: isAiActive
                  ? '0 8px 32px rgba(0,0,0,0.22)'
                  : '0 4px 24px rgba(0,0,0,0.18)',
                transition: 'box-shadow 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <TextField
                fullWidth
                multiline={isMultiline}
                maxRows={isMultiline ? 4 : undefined}
                placeholder="Ex: Appartement 3 pièces à Bastos moins de 150 000 FCFA…"
                value={aiQuery}
                inputRef={inputRef}
                onChange={(e) => setAiQuery(e.target.value)}
                onFocus={() => setAiFocused(true)}
                onBlur={() => setAiFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSearch();
                  }
                }}
                sx={{
                  ...inputSx,
                  '& .MuiOutlinedInput-root': {
                    ...(inputSx['& .MuiOutlinedInput-root'] as object),
                    minHeight: { xs: 54, md: 52 },
                    alignItems: isMultiline ? 'flex-start' : 'center',
                    transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                  },
                  '& .MuiInputBase-inputMultiline': {
                    pt: isMultiline ? '14px' : 0,
                    pb: isMultiline ? '12px' : 0,
                    resize: 'none',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={
                        isMultiline
                          ? { alignSelf: 'flex-start', mt: '13px' }
                          : {}
                      }
                    >
                      <AutoAwesome
                        sx={{ color: 'primary.main', fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      sx={[
                        { display: 'flex', alignItems: 'center', gap: 0.25 },
                        isMultiline
                          ? { alignSelf: 'flex-start', mt: '8px' }
                          : {},
                      ]}
                    >
                      {aiLoading ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CircularProgress
                            size={20}
                            sx={{ color: 'primary.main' }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          >
                            Recherche…
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <VoiceSearchButton
                            onTranscript={handleVoice}
                            disabled={aiLoading}
                            size={28}
                          />
                          <Box
                            role="button"
                            tabIndex={0}
                            aria-label="Lancer la recherche IA"
                            onClick={() => handleAiSearch()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleAiSearch();
                              }
                            }}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              '&:hover': { bgcolor: 'primary.dark' },
                              '&:active': { transform: 'scale(0.93)' },
                              '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: 2,
                              },
                              transition:
                                'background-color 0.2s, transform 0.15s',
                            }}
                          >
                            <SearchIcon sx={{ color: 'white', fontSize: 18 }} />
                          </Box>
                        </>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </motion.div>
          {aiError && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                mt: 0.75,
                display: 'block',
              }}
            >
              {aiError}
            </Typography>
          )}
          {/* Example chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
            {EXAMPLES.map((ex) => (
              <Box
                key={ex}
                role="button"
                tabIndex={0}
                aria-label={`Rechercher : ${ex}`}
                onClick={() => {
                  setAiQuery(ex);
                  handleAiSearch(ex);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setAiQuery(ex);
                    handleAiSearch(ex);
                  }
                }}
                sx={{
                  px: 1.5,
                  py: 1,
                  minHeight: 36,
                  borderRadius: 99,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: { xs: 11, sm: 12 },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                    transform: 'scale(1.02)',
                  },
                  '&:active': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(0.97)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid white',
                    outlineOffset: 2,
                  },
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
