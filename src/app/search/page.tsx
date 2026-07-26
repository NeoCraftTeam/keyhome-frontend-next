'use client';

import SearchAlertButton from '@/components/ads/SearchAlertButton';
import AppLoader from '@/components/ui/feedback/AppLoader';
import VoiceSearchButton from '@/components/search/VoiceSearchButton';
import { useAuth } from '@/providers/AuthProvider';
import dynamic from 'next/dynamic';
import SearchFiltersDrawerContent from './SearchFiltersDrawerContent';
import SearchResultsList from './SearchResultsList';

import { useSearchFilters } from '@/hooks/useSearchFilters';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useSearchResults } from '@/hooks/useSearchResults';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { DEFAULT_CENTER, MAPBOX_TOKEN } from '@/lib/constants';
import { escapeHtml } from '@/lib/sanitize';
import { formatVisitorPrice } from '@/providers/CurrencyProvider';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MotionConfig } from 'framer-motion';
import type * as MapboxGL from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

/**
 * Mapbox GL is lazy-loaded the first time the user actually needs the map.
 * On mobile, when the user opens the page in list-only mode, mapbox-gl is
 * never imported — saves ~200 kB gzipped from the initial bundle.
 *
 * The runtime module is cached at module scope so subsequent map
 * instantiations don't re-await the import.
 *
 * Note: mapbox-gl 3.x has a thin static interface (no `Map`, `Popup`, etc.
 * on the namespace shape). The ambient `typeof import('mapbox-gl')` doesn't
 * include them either. We type the runtime as `MapboxLib` (a structural
 * subset) and use `MapboxGL.X` for compile-time class types.
 */
type MapboxLib = {
  accessToken: string;
  config: { EVENTS_URL?: string };
  Map: new (opts: MapboxGL.MapOptions) => MapboxGL.Map;
  NavigationControl: new () => MapboxGL.NavigationControl;
  FullscreenControl: new () => MapboxGL.FullscreenControl;
  AttributionControl: new (
    opts?: MapboxGL.AttributionControlOptions
  ) => MapboxGL.AttributionControl;
  Popup: new (opts?: MapboxGL.PopupOptions) => MapboxGL.Popup;
  LngLatBounds: new () => MapboxGL.LngLatBounds;
};

let mapboxgl: MapboxLib | null = null;
let mapboxLoadPromise: Promise<MapboxLib> | null = null;

async function loadMapbox(): Promise<MapboxLib> {
  if (mapboxgl) return mapboxgl;
  if (!mapboxLoadPromise) {
    mapboxLoadPromise = import('mapbox-gl').then((mod) => {
      const lib = (mod.default ?? mod) as unknown as MapboxLib;
      lib.accessToken = MAPBOX_TOKEN;
      if (process.env.NODE_ENV === 'development') {
        try {
          Object.defineProperty(lib.config, 'EVENTS_URL', {
            value: '',
            writable: false,
          });
        } catch {
          // ignore — already defined or non-configurable in some bundlers
        }
      }
      mapboxgl = lib;
      return lib;
    });
  }
  return mapboxLoadPromise;
}

const IsochroneFilter = dynamic(
  () => import('@/components/ads/IsochroneFilter'),
  { ssr: false }
);

const MAP_POPUP_STYLES = `
  .kh-map-popup .mapboxgl-popup-content {
    padding: 0 !important;
    border-radius: 14px !important;
    overflow: hidden;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18) !important;
    border: none !important;
  }
  .kh-map-popup .mapboxgl-popup-tip {
    border-top-color: #fff !important;
  }
  .kh-map-popup-card {
    animation: kh-popup-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes kh-popup-in {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)  scale(1);    }
  }
  .kh-map-popup-img {
    transition: transform 0.35s ease;
  }
  .kh-map-popup-card:hover .kh-map-popup-img {
    transform: scale(1.06);
  }
`;

function SearchContent() {
  const router = useRouter();
  const theme = useTheme();
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    renderOptionFreeSolo,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const { isAuthenticated } = useAuth();
  const {
    history: searchHistory,
    addSearch,
    removeSearch,
  } = useSearchHistory();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxGL.Map | null>(null);
  const markersRef = useRef<MapboxGL.Marker[]>([]);
  const popupRef = useRef<MapboxGL.Popup | null>(null);

  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  /* ── Extracted hooks ───────────────────────────────────────── */
  const filters = useSearchFilters();
  const {
    query,
    setQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedCity,
    setSelectedCity,
    cityInput,
    setCityInput,
    selectedType,
    setSelectedType,
    selectedQuarter,
    setSelectedQuarter,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    priceRange,
    setPriceRange,
    surfaceRange,
    setSurfaceRange,
    hasParking,
    setHasParking,
    transactionType,
    setTransactionType,
    pricePeriod,
    setPricePeriod,
    has3dTour,
    setHas3dTour,
    selectedAmenities,
    setSelectedAmenities,
    page,
    setPage,
    mapStyle,
    setMapStyle,
    showHeatmap,
    setShowHeatmap,
    sortAnchor,
    setSortAnchor,
    cities,
    isCitiesLoading,
    adTypes,
    propertyAttributes,
    facets,
    activeFilterCount,
    sortLabel,
    clearFilters,
    buildParams,
  } = filters;

  const {
    ads,
    mapAds,
    totalPages,
    total,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSearchResults({ buildParams, isMobile, mobileViewMode });

  const mapStyleUrl =
    mapStyle === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : mapStyle === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12';

  useEffect(() => {
    const showMap = !isMobile || mobileViewMode === 'map';
    if (!showMap || !mapContainerRef.current || !MAPBOX_TOKEN) return;

    let cancelled = false;
    let createdMap: MapboxGL.Map | null = null;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    void loadMapbox().then((lib) => {
      if (cancelled || !mapContainerRef.current) return;

      const map = new lib.Map({
        container: mapContainerRef.current,
        style: mapStyleUrl,
        center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
        zoom: 11,
        attributionControl: false,
      });
      map.addControl(new lib.NavigationControl(), 'top-right');
      map.addControl(new lib.FullscreenControl(), 'top-right');
      map.addControl(
        new lib.AttributionControl({ compact: true }),
        'bottom-right'
      );
      mapRef.current = map;
      createdMap = map;
    });

    return () => {
      cancelled = true;
      if (createdMap) {
        createdMap.remove();
      }
      if (mapRef.current && mapRef.current === createdMap) {
        mapRef.current = null;
      }
    };
  }, [isMobile, mobileViewMode, mapStyleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old individual markers (legacy cleanup)
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const primaryColor = theme.palette.primary.main;

    // Build GeoJSON from ads
    const features: GeoJSON.Feature[] = mapAds
      .filter((ad) => ad.location)
      .map((ad) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [ad.location!.longitude, ad.location!.latitude],
        },
        properties: {
          id: ad.id,
          title: ad.title,
          slug: ad.slug,
          price: ad.price,
          thumb:
            ad.images?.[0]?.thumb ||
            ad.images?.[0]?.url ||
            '/placeholder-house.jpg',
          rating: ad.rating || 0,
          quarter: ad.quarter?.name || '',
          city: ad.quarter?.city_name || '',
        },
      }));

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    const setupLayers = () => {
      // Remove old source/layers if they exist (heatmap first — it has no dependent layers)
      if (map.getLayer('price-heatmap')) map.removeLayer('price-heatmap');
      if (map.getSource('search-ads-heatmap'))
        map.removeSource('search-ads-heatmap');
      if (map.getLayer('unclustered-point'))
        map.removeLayer('unclustered-point');
      if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
      if (map.getLayer('clusters')) map.removeLayer('clusters');
      if (map.getSource('search-ads')) map.removeSource('search-ads');

      map.addSource('search-ads', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'search-ads',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            primaryColor,
            10,
            '#e53935',
            30,
            '#b71c1c',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'search-ads',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual (unclustered) points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'search-ads',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': primaryColor,
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Heatmap layer (initially hidden)
      map.addSource('search-ads-heatmap', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'price-heatmap',
        type: 'heatmap',
        source: 'search-ads-heatmap',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'price'],
            0,
            0,
            5000000,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            15,
            3,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 30],
          'heatmap-opacity': 0.7,
        },
        layout: { visibility: 'none' },
      });

      // Click cluster → zoom in
      map.on('click', 'clusters', (e) => {
        const feat = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (!feat.length) return;
        const clusterId = feat[0].properties?.cluster_id;
        (
          map.getSource('search-ads') as MapboxGL.GeoJSONSource
        ).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            center: (feat[0].geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
            zoom,
          });
        });
      });

      // Click individual point → show popup
      map.on('click', 'unclustered-point', (e) => {
        const feat = e.features?.[0];
        if (!feat || feat.geometry.type !== 'Point') return;
        const props = feat.properties!;
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [
          number,
          number,
        ];

        const adUrl = `/ads/${encodeURIComponent(String(props.id))}/${encodeURIComponent(props.slug)}`;
        const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
        const locationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        const locName = [props.quarter, props.city].filter(Boolean).join(', ');
        const ratingHtml =
          props.rating > 0
            ? `<div style="display:flex;align-items:center;gap:3px;margin-top:3px">${starSvg}<span style="font-size:11px;font-weight:700;color:#334155">${Number(props.rating).toFixed(1)}</span></div>`
            : '';
        const locationHtml = locName
          ? `<div style="display:flex;align-items:center;gap:3px;margin-top:3px">${locationSvg}<span style="font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${escapeHtml(locName)}</span></div>`
          : '';

        if (popupRef.current) popupRef.current.remove();
        if (!mapboxgl) return;
        popupRef.current = new mapboxgl.Popup({
          offset: 14,
          closeButton: false,
          maxWidth: '210px',
          className: 'kh-map-popup',
        })
          .setLngLat(coords)
          .setHTML(
            `<a href="${adUrl}" class="kh-map-popup-card" style="display:block;width:210px;border-radius:14px;overflow:hidden;background:#fff;text-decoration:none;cursor:pointer;">
              <div style="width:100%;height:140px;overflow:hidden;background:#f1f5f9;position:relative;">
                <img src="${escapeHtml(props.thumb)}" alt="${escapeHtml(props.title)}" class="kh-map-popup-img" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.45) 0%,transparent 100%);height:48px;"></div>
                <div style="position:absolute;bottom:8px;left:10px;font-size:13px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);">${formatVisitorPrice(props.price)}</div>
              </div>
              <div style="padding:8px 10px 10px;">
                <div style="font-size:12px;font-weight:700;color:#0f172a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:2px;">${escapeHtml(props.title)}</div>
                ${locationHtml}
                ${ratingHtml}
              </div>
            </a>`
          )
          .addTo(map);
      });

      // Cursor styles
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('load', setupLayers);
    }

    // Fit bounds
    if (features.length > 0 && mapboxgl) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        bounds.extend(coords as [number, number]);
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapAds, mapStyleUrl]);

  // Toggle heatmap layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    try {
      if (map.getLayer('price-heatmap')) {
        map.setLayoutProperty(
          'price-heatmap',
          'visibility',
          showHeatmap ? 'visible' : 'none'
        );
      }
      // Hide/show cluster layers when heatmap is on
      ['clusters', 'cluster-count', 'unclustered-point'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            'visibility',
            showHeatmap ? 'none' : 'visible'
          );
        }
      });
    } catch {
      /* layer not ready yet */
    }
  }, [showHeatmap, mapStyleUrl]);

  const filtersDrawerContent = (
    <SearchFiltersDrawerContent
      filters={filters}
      isMobile={isMobile}
      total={total}
      onClose={() => setMoreFiltersOpen(false)}
      citySlotProps={citySlotProps}
      renderCityOption={renderCityOption}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Typography
          component="h1"
          sx={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Rechercher un logement — liste et carte interactive
        </Typography>
        <style dangerouslySetInnerHTML={{ __html: MAP_POPUP_STYLES }} />

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
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 1,
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Mobile top row: toggle + filter button */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={mobileViewMode}
                exclusive
                onChange={(_, val) => val && setMobileViewMode(val)}
                size="small"
                sx={{
                  flexShrink: 0,
                  '& .MuiToggleButton-root': {
                    borderRadius: '8px !important',
                    border: '1.5px solid',
                    borderColor: 'text.disabled',
                    px: 1.5,
                    py: 0.5,
                    color: 'text.primary',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  },
                  '& .Mui-selected': {
                    bgcolor: 'primary.main !important',
                    color: '#fff !important',
                    borderColor: 'primary.main !important',
                  },
                }}
              >
                <ToggleButton value="list" aria-label="Liste" sx={{ gap: 0.5 }}>
                  <ListIcon sx={{ fontSize: 16 }} />
                  Liste
                </ToggleButton>
                <ToggleButton value="map" aria-label="Carte" sx={{ gap: 0.5 }}>
                  <MapIcon sx={{ fontSize: 16 }} />
                  Carte
                </ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{ flex: 1 }} />

              <Button
                size="small"
                variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
                onClick={() => setMoreFiltersOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  flexShrink: 0,
                  ...(activeFilterCount > 0
                    ? {
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }
                    : { borderColor: 'text.secondary', color: 'text.primary' }),
                }}
              >
                Filtres
                {activeFilterCount > 0 && (
                  <Chip
                    label={activeFilterCount}
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 18,
                      minWidth: 18,
                      bgcolor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.15)'
                          : '#fff',
                      color: 'primary.main',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={clearFilters}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    color: 'text.secondary',
                    minWidth: 0,
                    px: 0.5,
                  }}
                >
                  Reset
                </Button>
              )}
            </Box>
          )}

          {/* Search bar — hidden on mobile map view to maximize map space */}
          <Autocomplete
            size="small"
            freeSolo
            forcePopupIcon={false}
            options={(() => {
              if (cityInput.length >= 1 && cities.length > 0) return cities;
              // Show recent searches when input is empty
              if (searchHistory.length > 0 && cityInput.length < 1) {
                return searchHistory.map((h) => ({
                  id: `history-${h.query}`,
                  name: h.query,
                  _isHistory: true,
                })) as unknown as typeof cities;
              }
              return cities;
            })()}
            getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
            value={selectedCity}
            onChange={(_, val) => {
              if (typeof val === 'string') {
                addSearch(val);
                setQuery(val);
                setSelectedCity(null);
              } else if (
                val &&
                (val as unknown as { _isHistory?: boolean })._isHistory
              ) {
                const historyVal = val.name;
                addSearch(historyVal);
                setCityInput(historyVal);
                setQuery(historyVal);
                setSelectedCity(null);
              } else {
                if (val) addSearch(val.name);
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
            noOptionsText={
              cityInput.length < 1
                ? searchHistory.length > 0
                  ? 'Recherches récentes'
                  : 'Tapez pour rechercher…'
                : 'Aucune ville trouvée'
            }
            loadingText="Recherche…"
            slotProps={citySlotProps}
            renderOption={(props, option) => {
              if ((option as unknown as { _isHistory?: boolean })._isHistory) {
                return (
                  <Box
                    component="li"
                    {...props}
                    key={option.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&.MuiAutocomplete-option': { py: 0.75 },
                    }}
                  >
                    <HistoryIcon
                      sx={{ fontSize: 16, color: 'text.secondary' }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {option.name}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label={`Supprimer "${option.name}" de l'historique`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearch(option.name);
                      }}
                      sx={{
                        // 44 × 44 px hit target (WCAG 2.5.5) — visual icon
                        // stays small via fontSize, padding gives the touch area.
                        minWidth: 44,
                        minHeight: 44,
                        p: 1,
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                );
              }
              return renderOptionFreeSolo(props, option);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Ville, quartier…"
                variant="outlined"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !selectedCity && cityInput.trim()) {
                    e.preventDefault();
                    addSearch(cityInput.trim());
                    setQuery(cityInput.trim());
                    setPage(1);
                  }
                }}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <SearchIcon
                        sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }}
                      />
                    ),
                    endAdornment: (
                      <>
                        {isCitiesLoading ? (
                          <CircularProgress color="inherit" size={16} />
                        ) : null}
                        <VoiceSearchButton
                          size={20}
                          onTranscript={(transcript) => {
                            setCityInput(transcript);
                            setQuery(transcript);
                            addSearch(transcript);
                            setPage(1);
                          }}
                          disabled={isCitiesLoading}
                        />
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
                            sx={{
                              minWidth: 44,
                              minHeight: 44,
                              p: 1,
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </>
                    ),
                  },
                }}
                sx={{
                  minWidth: { xs: 0, sm: 220, md: 280 },
                  flex: { xs: 1, md: '0 0 auto' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    py: '2px',
                    pr: '8px !important',
                    fontSize: '0.875rem',
                    bgcolor: 'background.default',
                    transition: 'all 0.2s ease',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      boxShadow: 'none',
                    },
                  },
                }}
              />
            )}
            sx={{
              flexShrink: 1,
              flexBasis: { xs: '100%', md: 'auto' },
              width: { xs: '100%', md: 'auto' },
              maxWidth: { xs: 560, md: 420 },
              mx: { xs: 'auto', md: 0 },
              display:
                isMobile && mobileViewMode === 'map' ? 'none' : 'inline-flex',
            }}
          />
          {/* Transaction type quick toggle — visible on both desktop and mobile list */}
          {!(isMobile && mobileViewMode === 'map') && (
            <ToggleButtonGroup
              value={transactionType}
              exclusive
              onChange={(_, val: 'location' | 'vente' | null) => {
                setTransactionType(val);
                setPage(1);
              }}
              size="small"
              sx={{
                flexShrink: 0,
                '& .MuiToggleButton-root': {
                  borderRadius: '8px !important',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  px: { xs: 1.25, md: 1.5 },
                  py: 0.5,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                },
                '& .Mui-selected': {
                  bgcolor: 'primary.main !important',
                  color: '#fff !important',
                  borderColor: 'primary.main !important',
                },
              }}
            >
              <ToggleButton value="location">À louer</ToggleButton>
              <ToggleButton value="vente">À vendre</ToggleButton>
            </ToggleButtonGroup>
          )}

          {!isMobile && (
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          )}

          {/* Filtres — desktop only (mobile has it in top row) */}
          {!isMobile && (
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
                  sx={{
                    ml: 0.5,
                    height: 18,
                    minWidth: 18,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    fontSize: '0.65rem',
                  }}
                />
              )}
            </Button>
          )}

          {!isMobile && activeFilterCount > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={clearFilters}
              sx={{
                textTransform: 'none',
                fontSize: '0.8rem',
                flexShrink: 0,
                color: 'text.secondary',
              }}
            >
              Réinitialiser
            </Button>
          )}

          {/* Results count badge — desktop only */}
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
        </Box>

        {/* Active filter chips — hidden on mobile map view */}
        {activeFilterCount > 0 && !(isMobile && mobileViewMode === 'map') && (
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
              <Chip
                label={`Ville: ${selectedCity.name}`}
                onDelete={() => setSelectedCity(null)}
                size="small"
                variant="outlined"
              />
            )}
            {selectedType && (
              <Chip
                label={`Type: ${selectedType.name}`}
                onDelete={() => setSelectedType(null)}
                size="small"
                variant="outlined"
              />
            )}
            {selectedQuarter && (
              <Chip
                label={`Quartier: ${selectedQuarter}`}
                onDelete={() => setSelectedQuarter('')}
                size="small"
                variant="outlined"
              />
            )}
            {bedrooms && (
              <Chip
                label={`${bedrooms}+ chambres`}
                onDelete={() => setBedrooms(undefined)}
                size="small"
                variant="outlined"
              />
            )}
            {transactionType && (
              <Chip
                label={
                  transactionType === 'location' ? '🏠 Location' : '🏷️ Vente'
                }
                onDelete={() => setTransactionType(null)}
                size="small"
                variant="outlined"
              />
            )}
            {pricePeriod && (
              <Chip
                label={pricePeriod === 'mois' ? '📅 Par mois' : '☀️ Par jour'}
                onDelete={() => setPricePeriod(null)}
                size="small"
                variant="outlined"
              />
            )}
            {hasParking && (
              <Chip
                label="Parking"
                onDelete={() => setHasParking(false)}
                size="small"
                variant="outlined"
              />
            )}
            {has3dTour && (
              <Chip
                icon={<ViewInArIcon sx={{ fontSize: 14 }} />}
                label="Visite 3D"
                onDelete={() => setHas3dTour(false)}
                size="small"
                variant="outlined"
              />
            )}
            {query && (
              <Chip
                label={`"${query}"`}
                onDelete={() => {
                  setQuery('');
                }}
                size="small"
                variant="outlined"
              />
            )}
            {/* Save search alert — prefilled with active filters */}
            <Box sx={{ ml: 'auto' }}>
              <SearchAlertButton
                prefill={{
                  city_id: selectedCity?.id,
                  city_name: selectedCity?.name,
                  type_id: selectedType?.id,
                  type_name: selectedType?.name,
                  bedrooms_min: bedrooms,
                  has_parking: hasParking || undefined,
                  query: query || undefined,
                }}
                size="small"
              />
            </Box>
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
                borderRadius: { md: 3 },
                overflow: 'hidden',
                borderRight: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              {!MAPBOX_TOKEN ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                  }}
                >
                  <Typography color="text.secondary">
                    Configurez NEXT_PUBLIC_MAPBOX_TOKEN
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    ref={mapContainerRef}
                    sx={{ width: '100%', height: '100%' }}
                  />
                  {/* Isochrone filter — zone accessible depuis le centre */}
                  <IsochroneFilter mapRef={mapRef} />
                  {/* Map style toggle */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      display: 'flex',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <Tooltip title="Plan">
                      <ToggleButton
                        value="streets"
                        selected={mapStyle === 'streets'}
                        onChange={() => setMapStyle('streets')}
                        size="small"
                        aria-label="Vue plan"
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '0 !important',
                        }}
                      >
                        Plan
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip title="Satellite">
                      <ToggleButton
                        value="satellite"
                        selected={mapStyle === 'satellite'}
                        onChange={() => setMapStyle('satellite')}
                        size="small"
                        aria-label="Vue satellite"
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '0 !important',
                        }}
                      >
                        Satellite
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip title="Sombre">
                      <ToggleButton
                        value="dark"
                        selected={mapStyle === 'dark'}
                        onChange={() => setMapStyle('dark')}
                        size="small"
                        aria-label="Vue sombre"
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '0 !important',
                        }}
                      >
                        Sombre
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        showHeatmap
                          ? 'Masquer la heatmap'
                          : 'Afficher la heatmap de prix'
                      }
                    >
                      <ToggleButton
                        value="heatmap"
                        selected={showHeatmap}
                        onChange={() => setShowHeatmap((prev) => !prev)}
                        size="small"
                        aria-label={
                          showHeatmap
                            ? 'Masquer la heatmap'
                            : 'Afficher la heatmap'
                        }
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '0 !important',
                          color: showHeatmap ? 'primary.main' : undefined,
                        }}
                      >
                        <WhatshotIcon sx={{ fontSize: 16 }} />
                      </ToggleButton>
                    </Tooltip>
                  </Box>
                </>
              )}
            </Box>
          )}

          {(!isMobile || mobileViewMode === 'list') && (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <SearchResultsList
                ads={ads}
                total={total}
                totalPages={totalPages}
                page={page}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                refetch={refetch}
                sortAnchor={sortAnchor}
                setSortAnchor={setSortAnchor}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                sortLabel={sortLabel}
                setPage={setPage}
                isAuthenticated={isAuthenticated}
                selectedCity={selectedCity}
                setCityInput={setCityInput}
                setSelectedCity={setSelectedCity}
                clearFilters={clearFilters}
                facets={facets}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </Box>
          )}
        </Box>

        <Drawer
          anchor={isMobile ? 'bottom' : 'right'}
          open={moreFiltersOpen}
          onClose={() => setMoreFiltersOpen(false)}
          PaperProps={{
            sx: isMobile
              ? { borderRadius: '16px 16px 0 0', maxHeight: 'min(85vh, 600px)' }
              : { width: 380 },
          }}
        >
          {filtersDrawerContent}
        </Drawer>
      </Box>
    </MotionConfig>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <SearchContent />
    </Suspense>
  );
}
