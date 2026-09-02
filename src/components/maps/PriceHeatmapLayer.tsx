'use client';

import { heatmapService, HeatmapFeature } from '@/services/estimator.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { formatPrice } from '@/lib/constants';
import { City } from '@/types';
import {
  Autocomplete,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/constants';

type MapboxGL = typeof import('mapbox-gl');

let mapboxPromise: Promise<MapboxGL> | null = null;
function loadMapbox(): Promise<MapboxGL> {
  if (!mapboxPromise) {
    mapboxPromise = import('mapbox-gl').then((mod) => {
      const mb = mod.default;
      mb.accessToken = MAPBOX_TOKEN;
      if (process.env.NODE_ENV === 'development') {
        Object.defineProperty(mb.config, 'EVENTS_URL', {
          value: '',
          writable: false,
        });
      }
      return mod;
    });
  }
  return mapboxPromise;
}

interface Props {
  height?: number;
}

export default function PriceHeatmapLayer({ height = 500 }: Props) {
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const mapStyle = isDarkMode
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [typeId, setTypeId] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<HeatmapFeature | null>(
    null
  );

  const { data: citiesData, isFetching: loadingCities } = useQuery({
    queryKey: ['cities-heatmap', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 20 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: types } = useQuery<import('@/types').AdType[]>({
    queryKey: ['types-heatmap'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: heatmap, isLoading } = useQuery({
    queryKey: ['price-heatmap', selectedCity?.id, typeId],
    queryFn: () =>
      heatmapService.get(selectedCity?.id || undefined, typeId || undefined),
    staleTime: 30 * 60 * 1000,
  });

  // Init map — recreate when theme changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (!mapContainerRef.current) {
      return;
    }

    let cancelled = false;
    const container = mapContainerRef.current;

    loadMapbox().then((mb) => {
      if (cancelled || !container) return;
      const mapboxgl = mb.default;

      const map = new mapboxgl.Map({
        container,
        style: mapStyle,
        center: DEFAULT_CENTER,
        zoom: 11,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        'bottom-right'
      );
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapStyle]);

  // Update heatmap data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !heatmap?.features) {
      return;
    }

    const onLoad = () => {
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: heatmap.features
          .filter((f) => f.lat && f.lng)
          .map((f) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
            properties: {
              intensity: f.intensity,
              median_price: f.median_price,
              quarter_name: f.quarter_name,
              ad_count: f.ad_count,
            },
          })),
      };

      if (map.getSource('price-heatmap')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map.getSource('price-heatmap') as any).setData(geojson);
      } else {
        map.addSource('price-heatmap', { type: 'geojson', data: geojson });

        map.addLayer({
          id: 'price-heatmap-layer',
          type: 'heatmap',
          source: 'price-heatmap',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': 1.5,
            'heatmap-radius': 40,
            'heatmap-opacity': 0.7,
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
          },
        });

        // Circle layer for interaction
        map.addLayer({
          id: 'price-points',
          type: 'circle',
          source: 'price-heatmap',
          minzoom: 12,
          paint: {
            'circle-radius': 12,
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0,
              '#3b82f6',
              0.5,
              '#f59e0b',
              1,
              '#ef4444',
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white',
          },
        });

        map.on(
          'mouseenter',
          'price-points',
          (
            e: Record<string, unknown> & {
              features?: Array<{ properties?: Record<string, unknown> }>;
            }
          ) => {
            map.getCanvas().style.cursor = 'pointer';
            const props = e.features?.[0]?.properties;
            if (props) {
              setHoveredFeature({
                quarter_name: props.quarter_name,
                median_price: props.median_price,
                ad_count: props.ad_count,
                intensity: props.intensity,
              } as HeatmapFeature);
            }
          }
        );

        map.on('mouseleave', 'price-points', () => {
          map.getCanvas().style.cursor = '';
          setHoveredFeature(null);
        });
      }

      // Fit to features
      if (heatmap.features.length > 0) {
        const lngs = heatmap.features.map((f) => f.lng).filter(Boolean);
        const lats = heatmap.features.map((f) => f.lat).filter(Boolean);
        if (lngs.length > 0) {
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, maxZoom: 14 }
          );
        }
      }
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.once('load', onLoad);
    }
  }, [heatmap]);

  const priceMin = heatmap?.price_range.min ?? 0;
  const priceMax = heatmap?.price_range.max ?? 0;

  return (
    <Box>
      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Autocomplete<City>
          options={citiesData?.data ?? []}
          getOptionLabel={(c) => c.name}
          value={selectedCity}
          onChange={(_, val) => setSelectedCity(val)}
          inputValue={cityInput}
          onInputChange={(_, val) => setCityInput(val)}
          loading={loadingCities}
          noOptionsText={
            cityInput.length < 1 ? 'Tapez une ville…' : 'Aucune ville trouvée'
          }
          slotProps={citySlotProps}
          renderOption={(props, option) => renderCityOption(props, option)}
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Ville"
              size="small"
              placeholder="Toutes les villes"
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
        <TextField
          select
          label="Type"
          size="small"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Tous les types</MenuItem>
          {types?.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>
        {isLoading && (
          <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
        )}
      </Box>

      {/* Map */}
      <Box sx={{ position: 'relative' }}>
        <Box
          ref={mapContainerRef}
          sx={{
            height: {
              xs: 'min(70vh, 480px)',
              sm: 'min(65vh, 450px)',
              md: height,
            },
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        />

        {/* Legend */}
        {priceMax > 0 && (
          <Paper
            elevation={2}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              p: 1.5,
              borderRadius: 2,
              width: 200,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              display="block"
              mb={0.75}
            >
              Prix médian / mois
            </Typography>
            <Box
              sx={{
                height: 10,
                borderRadius: 5,
                background:
                  'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444)',
                mb: 0.75,
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                {formatPrice(priceMin)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                {formatPrice(priceMax)}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Hover tooltip */}
        {hoveredFeature && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              p: 2,
              borderRadius: 2,
              minWidth: 180,
            }}
          >
            <Typography fontWeight={700} mb={0.5}>
              {hoveredFeature.quarter_name}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight={600}>
              {formatPrice(hoveredFeature.median_price)}/mois
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hoveredFeature.ad_count} annonce
              {hoveredFeature.ad_count > 1 ? 's' : ''}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
