'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { MAPBOX_TOKEN } from '@/lib/constants';
import { brandAgent, neutral, shadow } from '@/theme/tokens';
import GpsIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';

mapboxgl.accessToken = MAPBOX_TOKEN;
if (process.env.NODE_ENV === 'development') {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', {
    value: '',
    writable: false,
  });
}

const MAP_MARKER_BOX_SHADOW = `0 3px 12px ${alpha(brandAgent.primary, 0.4)}`;

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number | string;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  height = 300,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  // Default center: world-neutral fallback when no coords provided yet
  const defaultLat = latitude ?? 10.0;
  const defaultLng = longitude ?? 20.0;

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 40px; height: 40px;
            background: ${brandAgent.primary};
            border-radius: 50%;
            border: 3px solid ${neutral.white};
            box-shadow: ${MAP_MARKER_BOX_SHADOW};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;
        markerRef.current = new mapboxgl.Marker({
          element: el,
          draggable: true,
          anchor: 'center',
        })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        markerRef.current.on('dragend', () => {
          const lngLat = markerRef.current!.getLngLat();
          onLocationChange(
            Math.round(lngLat.lat * 1e6) / 1e6,
            Math.round(lngLat.lng * 1e6) / 1e6
          );
        });
      }
    },
    [onLocationChange]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [defaultLng, defaultLat],
      zoom: latitude && longitude ? 15 : 12,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', () => {
      if (latitude && longitude) {
        updateMarker(latitude, longitude);
      }
    });

    // Click to place marker
    map.on('click', (e) => {
      const lat = Math.round(e.lngLat.lat * 1e6) / 1e6;
      const lng = Math.round(e.lngLat.lng * 1e6) / 1e6;
      updateMarker(lat, lng);
      onLocationChange(lat, lng);
    });

    mapRef.current = map;

    return () => {
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      updateMarker(latitude, longitude);
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [latitude, longitude, updateMarker]);

  // Geocode search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery.trim()
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5&language=fr`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const [lng, lat] = data.features[0].center;
        updateMarker(lat, lng);
        onLocationChange(
          Math.round(lat * 1e6) / 1e6,
          Math.round(lng * 1e6) / 1e6
        );
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [searchQuery, updateMarker, onLocationChange]);

  // Auto-search: trigger geocoding 600ms after the user stops typing (>= 3 chars)
  useEffect(() => {
    if (searchQuery.trim().length < 3) return;
    const timer = setTimeout(() => {
      void handleSearch();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Geolocate user
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        updateMarker(lat, lng);
        onLocationChange(lat, lng);
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateMarker, onLocationChange]);

  if (!MAPBOX_TOKEN) {
    return (
      <AppAlert
        severity="warning"
        message="La carte est momentanément indisponible. Saisissez l'adresse manuellement, vous pourrez ajuster la position plus tard."
      />
    );
  }

  return (
    <Box>
      {/* Search bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Rechercher une adresse, un quartier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSearch}
                    disabled={searching}
                    aria-label="Rechercher l'adresse"
                    sx={{
                      '&:focus-visible': { boxShadow: shadow.agentFocusRing },
                    }}
                  >
                    {searching ? (
                      <ButtonSpinner size={18} />
                    ) : (
                      <SearchIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Tooltip title="Ma position" arrow>
          <IconButton
            onClick={handleGeolocate}
            disabled={geolocating}
            aria-label="Ma position"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              '&:focus-visible': { boxShadow: shadow.agentFocusRing },
            }}
          >
            {geolocating ? (
              <ButtonSpinner size={20} />
            ) : (
              <GpsIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Map */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'crosshair',
        }}
      />

      {/* Coordinates display */}
      {latitude && longitude && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
          }}
        >
          <GpsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">
            {latitude}, {longitude}
          </Typography>
        </Box>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: 'block' }}
      >
        Cliquez sur la carte ou glissez le marqueur pour positionner votre bien.
      </Typography>
    </Box>
  );
}
