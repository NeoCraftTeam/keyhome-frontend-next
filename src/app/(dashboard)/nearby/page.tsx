'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Slider,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  List as ListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { adsService } from '@/services/ads.service';
import { useAuth } from '@/providers/AuthProvider';
import { MAPBOX_TOKEN, DEFAULT_CENTER, formatPrice } from '@/lib/constants';
import AdCard from '@/components/ads/AdCard';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function NearbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [geoError, setGeoError] = useState('');
  const [showList, setShowList] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const geoInitRef = useRef(false);

  // Geolocation
  useEffect(() => {
    if (geoInitRef.current) return;
    geoInitRef.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => queueMicrotask(() => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })),
        () => {
          queueMicrotask(() => {
            setGeoError('Position introuvable, utilisation de Yaoundé par défaut.');
            setCoords({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
          });
        }
      );
    } else {
      queueMicrotask(() => setCoords({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }));
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !coords || !MAPBOX_TOKEN || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coords.lng, coords.lat],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // User position marker
    new mapboxgl.Marker({ color: '#F6475F' })
      .setLngLat([coords.lng, coords.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Votre position</strong>'))
      .addTo(map);

    map.on('load', () => setMapReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords]);

  const { data: nearbyAds, isLoading } = useQuery({
    queryKey: ['nearby', coords?.lat, coords?.lng, radius],
    queryFn: () =>
      user
        ? adsService.nearbyForUser(user.id, { latitude: coords!.lat, longitude: coords!.lng, radius })
        : adsService.nearby({ latitude: coords!.lat, longitude: coords!.lng, radius }),
    enabled: !!coords,
    staleTime: 60000,
  });

  const ads = useMemo(() => nearbyAds || [], [nearbyAds]);

  // Update markers when ads change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    ads.forEach((ad) => {
      if (!ad.location) return;

      const el = document.createElement('div');
      el.className = 'ad-marker';
      el.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        white-space: nowrap;
        border: 2px solid transparent;
        transition: all 0.2s;
      `;
      el.textContent = formatPrice(ad.price);
      el.onmouseenter = () => { el.style.background = '#222'; el.style.color = '#fff'; };
      el.onmouseleave = () => { el.style.background = '#fff'; el.style.color = '#000'; };
      el.onclick = () => router.push(`/ads/${ad.id}/${ad.slug}`);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([ad.location.longitude, ad.location.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [ads, mapReady, router]);

  const relocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        mapRef.current?.flyTo({ center: [newCoords.lng, newCoords.lat], zoom: 12 });
      },
      () => setGeoError('Position introuvable.')
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', position: 'relative' }}>
      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {!coords ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : !MAPBOX_TOKEN ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, bgcolor: 'grey.100' }}>
            <Typography color="text.secondary">Configurez NEXT_PUBLIC_MAPBOX_TOKEN dans .env.local</Typography>
          </Box>
        ) : (
          <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
        )}

        {/* Controls */}
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: isMobile ? 16 : 'auto',
            p: 2,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            width: isMobile ? 'auto' : 260,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>Rayon</Typography>
            <Chip label={`${radius} km`} size="small" color="primary" />
          </Box>
          <Slider
            value={radius}
            onChange={(_, val) => setRadius(val as number)}
            min={1}
            max={50}
            step={1}
            sx={{ color: 'primary.main' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={relocate} size="small" sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
              <MyLocationIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
              {ads.length} annonce{ads.length !== 1 ? 's' : ''} trouvée{ads.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {geoError && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{geoError}</Typography>}
        </Paper>

        {/* Mobile list toggle */}
        {isMobile && ads.length > 0 && (
          <Paper
            onClick={() => setShowList(true)}
            elevation={0}
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 3,
              py: 1.5,
              borderRadius: '40px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              bgcolor: '#222',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ListIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Liste ({ads.length})
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{ width: 380, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid', borderColor: 'divider', p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {ads.length} annonce{ads.length !== 1 ? 's' : ''} à proximité
          </Typography>
          {isLoading ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ads.map((ad) => <AdCard key={ad.id} ad={ad} showDistance />)}
            </Box>
          )}
          {!isLoading && ads.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
              Aucune annonce dans ce rayon.
            </Typography>
          )}
        </Box>
      )}

      {/* Mobile bottom sheet */}
      <Drawer
        anchor="bottom"
        open={isMobile && showList}
        onClose={() => setShowList(false)}
        PaperProps={{ sx: { borderRadius: '16px 16px 0 0', maxHeight: '75vh' } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>{ads.length} annonce{ads.length !== 1 ? 's' : ''}</Typography>
            <IconButton onClick={() => setShowList(false)}><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ads.map((ad) => <AdCard key={ad.id} ad={ad} showDistance />)}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
