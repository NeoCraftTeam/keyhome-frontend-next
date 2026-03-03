'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { DEFAULT_CENTER, formatPrice, MAPBOX_TOKEN } from '@/lib/constants';
import { escapeHtml } from '@/lib/sanitize';
import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { AdType, City, SearchParams } from '@/types';
import {
    Close as CloseIcon,
    Tune as FilterIcon,
    ViewModule as GridIcon,
    Map as MapIcon,
    Search as SearchIcon,
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
    Pagination,
    Slider,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter state — read initial query from URL
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Sync query from URL when navigating from navbar
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== query) {
      setQuery(urlQ);
      setPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AdType | null>(null);
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 1000]);
  const [hasParking, setHasParking] = useState(false);

  // Fetch cities matching input — server-side search
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 20 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch ad types
  const { data: adTypes } = useQuery({
    queryKey: ['adTypes'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  // Search results
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, selectedCity?.id, selectedType?.id, bedrooms, priceRange, surfaceRange, hasParking, sortBy, sortOrder, page],
    queryFn: () => adsService.search(buildParams()),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const { data: allAdsData } = useQuery({
    queryKey: ['search-map-all', query, selectedCity?.id, selectedType?.id, bedrooms, priceRange, surfaceRange, hasParking],
    queryFn: () => adsService.search({ ...buildParams(), page: 1, per_page: 200 }),
    staleTime: 2 * 60 * 1000,
    enabled: viewMode === 'map',
  });

  const ads = useMemo(() => data?.data || [], [data?.data]);
  const mapAds = useMemo(() => allAdsData?.data || ads, [allAdsData?.data, ads]);
  const totalPages = data?.meta?.last_page || 1;
  const total = data?.meta?.total || 0;

  // Map initialization + markers
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current || !MAPBOX_TOKEN) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
      zoom: 11,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, [viewMode]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || viewMode !== 'map') return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasGeo = false;

    mapAds.forEach((ad) => {
      if (!ad.location) return;
      hasGeo = true;
      const ratingHtml = ad.rating != null
        ? `<div style="color:#FFB400;font-size:12px">★ ${ad.rating.toFixed(1)}</div>`
        : '';

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div style="font-size:13px;font-weight:600;max-width:180px;cursor:pointer" onclick="window.location.href='/ads/${encodeURIComponent(ad.id)}/${encodeURIComponent(ad.slug)}'">
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
  }, [mapAds, viewMode, router]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCity(null);
    setCityInput('');
    setSelectedType(null);
    setBedrooms(undefined);
    setPriceRange([0, 5000000]);
    setSurfaceRange([0, 1000]);
    setHasParking(false);
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

  const FiltersContent = (
    <Box sx={{ p: 3, width: isMobile ? '100%' : 280 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Filtres</Typography>
        {isMobile && (
          <IconButton onClick={() => setFilterOpen(false)}><CloseIcon /></IconButton>
        )}
      </Box>

      {/* Keyword */}
      <TextField
        fullWidth
        size="small"
        placeholder="Mot-clé..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        slotProps={{
          input: { startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> },
        }}
        sx={{ mb: 2 }}
      />

      {/* City autocomplete */}
      <Autocomplete
        size="small"
        options={cities}
        getOptionLabel={(opt) => opt.name}
        value={selectedCity}
        onChange={(_, val) => { setSelectedCity(val); setPage(1); setCityDropdownOpen(false); }}
        inputValue={cityInput}
        onInputChange={(_, val, reason) => { if (reason !== 'reset') { setCityInput(val); setCityDropdownOpen(val.length >= 1); } }}
        onClose={() => setCityDropdownOpen(false)}
        open={cityDropdownOpen && cityInput.length >= 1 && !isCitiesLoading && cities.length > 0}
        filterOptions={(x) => x}
        loading={isCitiesLoading}
        noOptionsText="Aucune ville trouvée"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ville"
            placeholder="Rechercher une ville..."
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isCitiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
        )}
      />

      {/* Type */}
      <Autocomplete
        size="small"
        options={adTypes || []}
        getOptionLabel={(opt) => opt.name}
        value={selectedType}
        onChange={(_, val) => { setSelectedType(val); setPage(1); }}
        noOptionsText="Aucun type"
        renderInput={(params) => <TextField {...params} label="Type de bien" sx={{ mb: 2 }} />}
      />

      {/* Bedrooms */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Chambres</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        {[undefined, 1, 2, 3, 4, 5].map((val) => (
          <Chip
            key={val ?? 'all'}
            label={val === undefined ? 'Tous' : `${val}+`}
            size="small"
            onClick={() => { setBedrooms(val); setPage(1); }}
            variant={bedrooms === val ? 'filled' : 'outlined'}
            sx={bedrooms === val ? { bgcolor: 'secondary.main', color: '#fff' } : {}}
          />
        ))}
      </Box>

      {/* Price range */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Prix (FCFA)</Typography>
      <Slider
        value={priceRange}
        onChange={(_, val) => setPriceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0}
        max={5000000}
        step={50000}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${(val / 1000).toFixed(0)}k`}
        sx={{ mb: 2 }}
      />

      {/* Surface range */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Surface (m²)</Typography>
      <Slider
        value={surfaceRange}
        onChange={(_, val) => setSurfaceRange(val as [number, number])}
        onChangeCommitted={() => setPage(1)}
        min={0}
        max={1000}
        step={10}
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />

      {/* Parking */}
      <FormControlLabel
        control={<Switch checked={hasParking} onChange={(e) => { setHasParking(e.target.checked); setPage(1); }} />}
        label="Parking"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" size="small" onClick={clearFilters}>
          Réinitialiser
        </Button>
        {isMobile && (
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => setFilterOpen(false)}
            sx={{ background: 'linear-gradient(to right, #F6475F, #D93A50)' }}
          >
            Voir {total} résultats
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 130px)' }}>
      {/* Desktop sidebar filters */}
      {!isMobile && (
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowY: 'auto',
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
          }}
        >
          {FiltersContent}
        </Box>
      )}

      {/* Mobile filter drawer */}
      <Drawer
        anchor="bottom"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px 16px 0 0', maxHeight: '85vh' } }}
      >
        {FiltersContent}
      </Drawer>

      {/* Results + Map */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: { xs: 2, md: 3 },
            pb: 0,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {query ? `Résultats pour "${query}"` : 'Toutes les annonces'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {total} annonce{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
              {isFetching && !isLoading && ' — mise à jour...'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
             {/* Sort Dropdown */}
             <TextField
              select
              size="small"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPage(1);
              }}
              SelectProps={{ native: true }}
              sx={{ width: 180 }}
            >
              <option value="created_at-desc">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="surface_area-asc">Surface croissante</option>
              <option value="surface_area-desc">Surface décroissante</option>
            </TextField>

            <Box sx={{ display: 'flex', gap: 1 }}>
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterOpen(true)}
                sx={{ borderRadius: '20px', textTransform: 'none' }}
                size="small"
              >
                Filtres
                {activeFilterCount > 0 && (
                  <Chip label={activeFilterCount} size="small" sx={{ ml: 0.5, height: 18, minWidth: 18, bgcolor: 'primary.main', color: '#fff' }} />
                )}
              </Button>
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
            >
              <ToggleButton value="list"><GridIcon sx={{ fontSize: 18 }} /></ToggleButton>
              <ToggleButton value="map"><MapIcon sx={{ fontSize: 18 }} /></ToggleButton>
            </ToggleButtonGroup>
            </Box>
          </Box>
        </Box>

        {/* Active filters chips */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: { xs: 2, md: 3 }, pt: 1 }}>
            {selectedCity && <Chip label={`Ville: ${selectedCity.name}`} onDelete={() => setSelectedCity(null)} size="small" variant="outlined" />}
            {selectedType && <Chip label={`Type: ${selectedType.name}`} onDelete={() => setSelectedType(null)} size="small" variant="outlined" />}
            {bedrooms && <Chip label={`${bedrooms}+ chambres`} onDelete={() => setBedrooms(undefined)} size="small" variant="outlined" />}
            {hasParking && <Chip label="Parking" onDelete={() => setHasParking(false)} size="small" variant="outlined" />}
          </Box>
        )}

        {/* Content area */}
        {viewMode === 'list' ? (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
              {isLoading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <Grid key={idx} size={{ xs: 6, sm: 6, lg: 4, xl: 3 }}>
                      <AdCardSkeleton />
                    </Grid>
                  ))
                : ads.map((ad) => (
                    <Grid key={ad.id} size={{ xs: 6, sm: 6, lg: 4, xl: 3 }}>
                      <AdCard ad={ad} />
                    </Grid>
                  ))}
            </Grid>

            {!isLoading && ads.length === 0 && (
              <EmptyState
                Icon={SearchIcon}
                title="Aucun résultat trouvé"
                description="Aucune annonce ne correspond à vos critères. Essayez de réduire le nombre de filtres ou d'élargir votre zone de recherche."
                actionLabel="Effacer les filtres"
                onAction={clearFilters}
              />
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => { setPage(val); }}
                  shape="rounded"
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1, position: 'relative', m: { xs: 1, md: 2 }, borderRadius: 3, overflow: 'hidden' }}>
            {!MAPBOX_TOKEN ? (
              <Box sx={{ height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 3 }}>
                <Typography color="text.secondary">Configurez NEXT_PUBLIC_MAPBOX_TOKEN</Typography>
              </Box>
            ) : (
              <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%', minHeight: { xs: 'calc(100vh - 250px)', md: 'calc(100vh - 200px)' } }} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress /></Box>}>
      <SearchContent />
    </Suspense>
  );
}
