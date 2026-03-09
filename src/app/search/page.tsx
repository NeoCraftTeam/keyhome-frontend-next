'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import AppLoader from '@/components/ui/AppLoader';
import QueryError from '@/components/ui/QueryError';
import { DEFAULT_CENTER, formatPrice, MAPBOX_TOKEN } from '@/lib/constants';
import { escapeHtml } from '@/lib/sanitize';
import { useAuth } from '@/providers/AuthProvider';
import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { AdType, City, SearchParams } from '@/types';
import {
    Close as CloseIcon,
    List as ListIcon,
    Map as MapIcon,
    Search as SearchIcon,
    Tune as TuneIcon,
    WhatsApp as WhatsAppIcon,
    HomeWork as HomeWorkIcon,
} from '@mui/icons-material';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    FormControlLabel,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    Pagination,
    Slider,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    Fab,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

mapboxgl.accessToken = MAPBOX_TOKEN;

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState(searchParams.get('city') || '');
  const [selectedType, setSelectedType] = useState<AdType | null>(null);
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 1000]);
  const [hasParking, setHasParking] = useState(false);

  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  // Sync URL params on mount and navigation
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== query) {
      setQuery(urlQ);
      setPage(1);
    }

    // Sync ?city= param → set cityInput so the autocomplete query triggers
    const urlCity = searchParams.get('city') || '';
    if (urlCity && !selectedCity) {
      setCityInput(urlCity);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 20 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adTypes } = useQuery({
    queryKey: ['adTypes'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  // Auto-select city from URL param when cities load
  useEffect(() => {
    const urlCity = searchParams.get('city') || '';
    if (urlCity && !selectedCity && citiesData?.data?.length) {
      const match = citiesData.data.find(
        (c) => c.name.toLowerCase() === urlCity.toLowerCase()
      );
      if (match) {
        setSelectedCity(match);
        setCityInput(match.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesData]);

  // Auto-select type from URL param when adTypes load
  useEffect(() => {
    const urlType = searchParams.get('type') || '';
    if (urlType && !selectedType && adTypes?.length) {
      const match = adTypes.find(
        (t) => t.name.toLowerCase() === urlType.toLowerCase()
      );
      if (match) {
        setSelectedType(match);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adTypes]);

  const buildParams = (): SearchParams => ({
    q: query || undefined,
    city: selectedCity?.name || undefined,
    type: selectedType?.name || undefined,
    bedrooms: bedrooms || undefined,
    price_min: priceRange[0] > 0 ? priceRange[0] : undefined,
    price_max: priceRange[1] < 5000000 ? priceRange[1] : undefined,
    surface_min: surfaceRange[0] > 0 ? surfaceRange[0] : undefined,
    surface_max: surfaceRange[1] < 1000 ? surfaceRange[1] : undefined,
    has_parking: hasParking || undefined,
    sort: sortBy,
    order: sortOrder,
    page,
    per_page: 20,
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['search', query, selectedCity?.id, selectedType?.id, bedrooms, priceRange, surfaceRange, hasParking, sortBy, sortOrder, page],
    queryFn: () => adsService.search(buildParams()),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const { data: allAdsData } = useQuery({
    queryKey: ['search-map-all', query, selectedCity?.id, selectedType?.id, bedrooms, priceRange, surfaceRange, hasParking],
    queryFn: () => adsService.search({ ...buildParams(), page: 1, per_page: 200 }),
    staleTime: 2 * 60 * 1000,
    enabled: !isMobile || mobileViewMode === 'map',
  });

  const ads = useMemo(() => data?.data || [], [data?.data]);
  const mapAds = useMemo(() => allAdsData?.data || ads, [allAdsData?.data, ads]);
  const totalPages = data?.meta?.last_page || 1;
  const total = data?.meta?.total || 0;

  useEffect(() => {
    const showMap = !isMobile || mobileViewMode === 'map';
    if (!showMap || !mapContainerRef.current || !MAPBOX_TOKEN || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
      zoom: 11,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, [isMobile, mobileViewMode]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasGeo = false;

    mapAds.forEach((ad) => {
      if (!ad.location) return;
      hasGeo = true;

      const ratingHtml = ad.rating
        ? `<div style="color:#F59E0B;font-size:12px">&#9733; ${ad.rating.toFixed(1)}</div>`
        : '';

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div style="font-size:13px;font-weight:600;max-width:180px;cursor:pointer;color:#222" onclick="window.location.href='/ads/${encodeURIComponent(String(ad.id))}/${encodeURIComponent(ad.slug)}'">
          <div>${escapeHtml(ad.title)}</div>
          <div style="color:#F6475F;font-weight:700">${formatPrice(ad.price)}</div>
          ${ratingHtml}
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: '#F6475F' })
        .setPopup(popup)
        .setLngLat([ad.location.longitude, ad.location.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([ad.location.longitude, ad.location.latitude]);
    });

    if (hasGeo) {
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [mapAds, router]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCity(null);
    setCityInput('');
    setSelectedType(null);
    setBedrooms(undefined);
    setPriceRange([0, 5000000]);
    setSurfaceRange([0, 1000]);
    setHasParking(false);
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const activeFilterCount = [
    selectedCity,
    selectedType,
    bedrooms,
    priceRange[0] > 0,
    priceRange[1] < 5000000,
    surfaceRange[0] > 0,
    surfaceRange[1] < 1000,
    hasParking,
  ].filter(Boolean).length;

  const cities = citiesData?.data || [];

  const sortLabel =
    sortBy === 'price' && sortOrder === 'asc' ? 'Prix ↑'
    : sortBy === 'price' && sortOrder === 'desc' ? 'Prix ↓'
    : sortBy === 'surface_area' ? 'Surface'
    : 'Plus récents';

  const MoreFiltersDrawer = (
    <Box sx={{ p: 3, width: isMobile ? '100%' : 380 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>Tous les filtres</Typography>
        <IconButton aria-label="Fermer" onClick={() => setMoreFiltersOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Autocomplete
        size="small"
        options={cities}
        getOptionLabel={(opt) => opt.name}
        value={selectedCity}
        onChange={(_, val) => { setSelectedCity(val); setCityInput(val?.name || ''); setPage(1); }}
        inputValue={cityInput}
        onInputChange={(_, val, reason) => { if (reason !== 'reset') { setCityInput(val); } }}
        filterOptions={(x) => x}
        loading={isCitiesLoading}
        noOptionsText={cityInput.length < 1 ? 'Tapez pour rechercher…' : 'Aucune ville trouvée'}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ville"
            placeholder="Rechercher une ville…"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isCitiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{ mb: 2 }}
          />
        )}
      />

      <Autocomplete
        size="small"
        options={adTypes || []}
        getOptionLabel={(opt) => opt.name}
        value={selectedType}
        onChange={(_, val) => { setSelectedType(val); setPage(1); }}
        noOptionsText="Aucun type"
        renderInput={(params) => <TextField {...params} label="Type de bien" sx={{ mb: 2 }} />}
      />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Prix (FCFA)</Typography>
      <Slider
        value={priceRange}
        onChange={(_, val) => setPriceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0} max={5000000} step={50000}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${(val / 1000).toFixed(0)}k`}
        sx={{ mb: 0.5 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" color="text.secondary">0 FCFA</Typography>
        <Typography variant="caption" color="text.secondary">5 000 000 FCFA</Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Chambres</Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
        {[undefined, 1, 2, 3, 4, 5].map((val) => (
          <Chip
            key={val ?? 'all'}
            label={val === undefined ? 'Tous' : `${val}+`}
            size="small"
            onClick={() => { setBedrooms(val); setPage(1); }}
            variant={bedrooms === val ? 'filled' : 'outlined'}
            sx={bedrooms === val ? { bgcolor: 'primary.main', color: '#fff' } : {}}
          />
        ))}
      </Box>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Surface (m²)</Typography>
      <Slider
        value={surfaceRange}
        onChange={(_, val) => setSurfaceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0} max={1000} step={10}
        valueLabelDisplay="auto"
        sx={{ mb: 2.5 }}
      />

      <FormControlLabel
        control={<Switch checked={hasParking} onChange={(e) => { setHasParking(e.target.checked); setPage(1); }} />}
        label="Parking inclus"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={clearFilters}>
          Réinitialiser
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setMoreFiltersOpen(false)}
          sx={{ background: 'linear-gradient(to right, #F6475F, #D93A50)' }}
        >
          Voir {total} résultats
        </Button>
      </Box>
    </Box>
  );

  const ResultsList = (
    <Box
      sx={{
        height: { md: 'calc(100vh - 140px)' },
        overflowY: { md: 'auto' },
        px: { xs: 2, md: 2.5 },
        pt: 1.5,
        pb: 4,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          {isFetching && !isLoading ? (
            'Mise à jour…'
          ) : (
            <><strong style={{ color: 'inherit', fontWeight: 800 }}>{total.toLocaleString('fr-FR')}</strong> annonce{total > 1 ? 's' : ''}</>
          )}
        </Typography>

        <Button
          size="small"
          endIcon={<span style={{ fontSize: 10 }}>▾</span>}
          onClick={(e) => setSortAnchor(e.currentTarget)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            px: 1.5,
            py: 0.25,
          }}
        >
          {sortLabel}
        </Button>
        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
          {[
            { label: 'Plus récents', sb: 'created_at', so: 'desc' },
            { label: 'Prix croissant', sb: 'price', so: 'asc' },
            { label: 'Prix décroissant', sb: 'price', so: 'desc' },
            { label: 'Surface croissante', sb: 'surface_area', so: 'asc' },
          ].map((opt) => (
            <MenuItem
              key={opt.label}
              selected={sortBy === opt.sb && sortOrder === opt.so}
              onClick={() => { setSortBy(opt.sb); setSortOrder(opt.so as 'asc' | 'desc'); setPage(1); setSortAnchor(null); }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {isError ? (
        <QueryError onRetry={() => refetch()} message="Impossible de charger les résultats." />
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ '& .ad-card-title': { color: '#222 !important' } }}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <Grid key={idx} size={{ xs: 6, lg: 6, xl: 4 }}>
                    <AdCardSkeleton />
                  </Grid>
                ))
              : ads.map((ad) => (
                  <Grid key={ad.id} size={{ xs: 6, lg: 6, xl: 4 }}>
                    <AdCard ad={ad} />
                  </Grid>
                ))}
          </Grid>

          {!isLoading && ads.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
              <HomeWorkIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                Aucun résultat trouvé
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}>
                Nous n&apos;avons pas trouvé de biens correspondant à vos critères actuels. Essayez d&apos;élargir votre zone de recherche ou de réinitialiser vos filtres.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={clearFilters}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    px: 3,
                    boxShadow: '0 4px 14px 0 rgba(246,71,95,0.39)',
                  }}
                >
                  Réinitialiser tout
                </Button>
                {selectedCity && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setCityInput('');
                      setSelectedCity(null);
                      setPage(1);
                    }}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  >
                    Changer de ville
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                shape="rounded"
                size="small"
                sx={{
                  '& .MuiPaginationItem-root.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* FILTER BAR */}
      <Box
        sx={{
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* City autocomplete */}
        <Autocomplete
          size="small"
          freeSolo
          options={citiesData?.data || []}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
          value={selectedCity}
          onChange={(_, val) => {
            if (typeof val === 'string') {
              setQuery(val);
              setSelectedCity(null);
            } else {
              setSelectedCity(val);
              setCityInput(val?.name || '');
              setQuery('');
            }
            setPage(1);
          }}
          inputValue={cityInput}
          onInputChange={(_, val, reason) => {
            if (reason !== 'reset') {
              setCityInput(val);
            }
          }}
          filterOptions={(x) => x}
          loading={isCitiesLoading}
          noOptionsText={cityInput.length < 1 ? 'Tapez pour rechercher…' : 'Aucune ville trouvée'}
          loadingText="Recherche…"
          slotProps={{
            paper: { sx: { borderRadius: 3, mt: 0.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } },
            listbox: { sx: { py: 0.5 } },
          }}
          renderOption={(props, option) => (
            <li {...props} key={typeof option === 'string' ? option : option.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography sx={{ fontSize: '0.875rem' }}>
                  {typeof option === 'string' ? option : option.name}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Ville, quartier…"
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !selectedCity && cityInput.trim()) {
                  e.preventDefault();
                  setQuery(cityInput.trim());
                  setPage(1);
                }
              }}
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />,
                  endAdornment: (
                    <>
                      {isCitiesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {(selectedCity || cityInput) && (
                        <IconButton
                          size="small"
                          aria-label="Effacer la recherche"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCity(null);
                            setCityInput('');
                            setQuery('');
                            setPage(1);
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </>
                  ),
                },
              }}
              sx={{
                minWidth: { xs: 180, md: 280 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  py: '2px',
                  pr: '8px !important',
                  fontSize: '0.875rem',
                  bgcolor: 'background.default',
                  transition: 'all 0.2s ease',
                  '& fieldset': { borderColor: 'divider' },
                  '&:hover fieldset': { borderColor: 'text.secondary' },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 3px rgba(246,71,95,0.12)',
                  },
                },
              }}
            />
          )}
          sx={{ flexShrink: 0 }}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Filtres */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
          onClick={() => setMoreFiltersOpen(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            fontSize: '0.825rem',
            flexShrink: 0,
            borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
            color: activeFilterCount > 0 ? 'primary.main' : 'text.primary',
          }}
        >
          Filtres
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              sx={{ ml: 0.5, height: 18, minWidth: 18, bgcolor: 'primary.main', color: '#fff', fontSize: '0.65rem' }}
            />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            size="small"
            variant="text"
            onClick={clearFilters}
            sx={{ textTransform: 'none', fontSize: '0.8rem', flexShrink: 0, color: 'text.secondary' }}
          >
            Réinitialiser
          </Button>
        )}

        {/* Results count badge */}
        {!isMobile && !isLoading && total > 0 && (
          <Chip
            label={`${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''}`}
            size="small"
            sx={{
              ml: 'auto',
              flexShrink: 0,
              fontWeight: 700,
              fontSize: '0.8rem',
              bgcolor: 'primary.main',
              color: '#fff',
              px: 0.5,
            }}
          />
        )}

        {isMobile && (
          <ToggleButtonGroup
            value={mobileViewMode}
            exclusive
            onChange={(_, val) => val && setMobileViewMode(val)}
            size="small"
            sx={{
              ml: 'auto',
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                borderRadius: '8px !important',
                border: '1px solid',
                borderColor: 'divider',
                px: 1.5,
              },
              '& .Mui-selected': {
                bgcolor: 'primary.main !important',
                color: '#fff !important',
              },
            }}
          >
            <ToggleButton value="list" aria-label="Liste" sx={{ gap: 0.5, fontSize: '0.8rem', fontWeight: 600 }}>
              <ListIcon sx={{ fontSize: 16 }} />
              Liste
            </ToggleButton>
            <ToggleButton value="map" aria-label="Carte" sx={{ gap: 0.5, fontSize: '0.8rem', fontWeight: 600 }}>
              <MapIcon sx={{ fontSize: 16 }} />
              Carte
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            px: 2,
            py: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          {selectedCity && (
            <Chip label={`Ville: ${selectedCity.name}`} onDelete={() => setSelectedCity(null)} size="small" variant="outlined" />
          )}
          {selectedType && (
            <Chip label={`Type: ${selectedType.name}`} onDelete={() => setSelectedType(null)} size="small" variant="outlined" />
          )}
          {bedrooms && (
            <Chip label={`${bedrooms}+ chambres`} onDelete={() => setBedrooms(undefined)} size="small" variant="outlined" />
          )}
          {hasParking && (
            <Chip label="Parking" onDelete={() => setHasParking(false)} size="small" variant="outlined" />
          )}
          {query && (
            <Chip label={`"${query}"`} onDelete={() => { setQuery(''); }} size="small" variant="outlined" />
          )}
        </Box>
      )}

      {/* MAP + RESULTS SPLIT */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(!isMobile || mobileViewMode === 'map') && (
          <Box
            sx={{
              width: { xs: '100%', md: '45%' },
              flexShrink: 0,
              position: 'relative',
              borderRight: { md: '1px solid' },
              borderColor: { md: 'divider' },
            }}
          >
            {!MAPBOX_TOKEN ? (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Typography color="text.secondary">Configurez NEXT_PUBLIC_MAPBOX_TOKEN</Typography>
              </Box>
            ) : (
              <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
            )}
          </Box>
        )}

        {(!isMobile || mobileViewMode === 'list') && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {ResultsList}
          </Box>
        )}
      </Box>

      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={moreFiltersOpen}
        onClose={() => setMoreFiltersOpen(false)}
        PaperProps={{
          sx: isMobile
            ? { borderRadius: '16px 16px 0 0', maxHeight: '85vh' }
            : { width: 380 },
        }}
      >
        {MoreFiltersDrawer}
      </Drawer>

      {/* WhatsApp help FAB */}
      <Tooltip title="Besoin d'aide ? Contactez-nous" placement="left">
        <Fab
          component="a"
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '237657507909'}?text=${encodeURIComponent('Bonjour KeyHome ! 👋 Je cherche un logement et j\'aimerais votre aide pour trouver le bien idéal.')}`}
          target="_blank"
          rel="noopener noreferrer"
          size="medium"
          aria-label="WhatsApp"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 20, md: 28 },
            right: { xs: 16, md: 28 },
            bgcolor: '#25D366',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
            zIndex: 50,
            '&:hover': {
              bgcolor: '#1DA851',
              transform: 'scale(1.08)',
              boxShadow: '0 6px 28px rgba(37,211,102,0.5)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          <WhatsAppIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <SearchContent />
    </Suspense>
  );
}
