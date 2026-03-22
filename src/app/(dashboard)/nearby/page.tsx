'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import AppLoader from '@/components/ui/AppLoader';
import { DEFAULT_CENTER, formatPrice, MAPBOX_TOKEN } from '@/lib/constants';
import { escapeHtml } from '@/lib/sanitize';
import { useAuth } from '@/providers/AuthProvider';
import { brand } from '@/theme/tokens';
import { adsService } from '@/services/ads.service';
import {
  Close as CloseIcon,
  FilterList as FilterListIcon,
  List as ListIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Paper,
  Slider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

mapboxgl.accessToken = MAPBOX_TOKEN;
if (process.env.NODE_ENV === 'development') {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', { value: '', writable: false });
}

const typeFilters = [
  { label: 'Tous', value: '' },
  { label: 'Maisons', value: 'maison' },
  { label: 'Appartements', value: 'appartement' },
  { label: 'Terrains', value: 'terrain' },
  { label: 'Villas', value: 'villa' },
  { label: 'Commerces', value: 'commerce' },
];

const MAX_PRICE = 5_000_000;

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
  const [showFilter, setShowFilter] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const geoInitRef = useRef(false);

  // Filter state
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

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
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // User position marker
    new mapboxgl.Marker({ color: brand.primary })
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

  const allAds = useMemo(() => nearbyAds || [], [nearbyAds]);

  // Client-side filtering by type and price
  const filteredAds = useMemo(() => {
    return allAds.filter((ad) => {
      if (selectedType && ad.type?.name?.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (ad.price != null) {
        if (ad.price < priceRange[0]) return false;
        if (priceRange[1] < MAX_PRICE && ad.price > priceRange[1]) return false;
      }
      return true;
    });
  }, [allAds, selectedType, priceRange]);

  // Update markers when filtered ads change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredAds.forEach((ad) => {
      if (!ad.location) return;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div style="font-size:13px;font-weight:600;max-width:180px;cursor:pointer" onclick="window.location.href='/ads/${encodeURIComponent(ad.id)}/${encodeURIComponent(ad.slug)}'">
          <div>${escapeHtml(ad.title)}</div>
          <div style="color:${brand.primary};font-weight:700">${formatPrice(ad.price)}</div>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: brand.primary })
        .setPopup(popup)
        .setLngLat([ad.location.longitude, ad.location.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [filteredAds, mapReady, router]);

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

  const hasActiveFilters = selectedType !== '' || priceRange[0] > 0 || priceRange[1] < MAX_PRICE;

  const clearFilters = () => {
    setSelectedType('');
    setPriceRange([0, MAX_PRICE]);
  };

  const filterPanelContent = (
    <>
      {/* Radius slider */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>Rayon</Typography>
        <Chip label={`${radius} km`} size="small" color="primary" />
      </Box>
      <Slider value={radius} onChange={(_, val) => setRadius(val as number)} min={1} max={50} step={1} sx={{ color: 'primary.main' }} />

      <Divider sx={{ my: 1 }} />

      {/* Type filter chips */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.75 }}>Type de bien</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.25, overflow: 'hidden' }}>
        {typeFilters.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            size="small"
            onClick={() => setSelectedType(t.value)}
            variant={selectedType === t.value ? 'filled' : 'outlined'}
            sx={{
              fontSize: '0.72rem',
              height: 24,
              ...(selectedType === t.value
                ? { bgcolor: brand.primary, color: '#fff', fontWeight: 600 }
                : { fontWeight: 500 }),
            }}
          />
        ))}
      </Box>

      {/* Price range slider */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.25 }}>Prix (FCFA)</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        {formatPrice(priceRange[0])} — {priceRange[1] >= MAX_PRICE ? 'Max' : formatPrice(priceRange[1])}
      </Typography>
      <Slider
        value={priceRange}
        onChange={(_, val) => setPriceRange(val as [number, number])}
        min={0} max={MAX_PRICE} step={50000}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${(val / 1000).toFixed(0)}k`}
        sx={{ mb: 0.5 }}
      />

      {/* Relocate + counts */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <IconButton aria-label="Recentrer la carte" onClick={relocate} size="small"
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <MyLocationIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {filteredAds.length} annonce{filteredAds.length !== 1 ? 's' : ''} trouvée{filteredAds.length !== 1 ? 's' : ''}
          {hasActiveFilters && ` (${allAds.length} au total)`}
        </Typography>
      </Box>

      {hasActiveFilters && (
        <Chip label="Réinitialiser filtres" size="small" onDelete={clearFilters} onClick={clearFilters}
          sx={{ mt: 0.75, width: '100%' }} variant="outlined" />
      )}

      {geoError && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{geoError}</Typography>}
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', position: 'relative' }}>
      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {!coords ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppLoader size={48} />
          </Box>
        ) : !MAPBOX_TOKEN ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, bgcolor: 'grey.100' }}>
            <Typography color="text.secondary">Configurez NEXT_PUBLIC_MAPBOX_TOKEN dans .env.local</Typography>
          </Box>
        ) : (
          <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />
        )}

        {/* Controls overlay */}
        {/* Filter panel — always shown on desktop; animated on mobile */}
        {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            borderRadius: 3,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 4px 16px rgba(0,0,0,0.4)'
                : '0 4px 12px rgba(0,0,0,0.1)',
            width: 280,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
          }}
        >
          {filterPanelContent}
        </Paper>
        )}

        {/* Mobile animated filter panel */}
        {isMobile && (
          <AnimatePresence>
            {showFilter && (
              <motion.div
                key="filter-panel"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                style={{ position: 'absolute', top: 70, left: 12, right: 12, zIndex: 20 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '0 8px 32px rgba(0,0,0,0.5)'
                        : '0 8px 24px rgba(0,0,0,0.15)',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.97)'
                        : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    maxHeight: '42vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
                  }}
                >
                  {filterPanelContent}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Mobile FAB: toggle filter panel */}
        {isMobile && (
          <Fab
            size="small"
            onClick={() => setShowFilter((v) => !v)}
            aria-label={showFilter ? 'Masquer les filtres' : 'Afficher les filtres'}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: showFilter ? brand.primary : 'background.paper',
              color: showFilter ? '#fff' : 'text.primary',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              transition: 'all 0.25s ease',
              '&:hover': { bgcolor: showFilter ? brand.primaryDark : 'action.hover' },
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FilterListIcon sx={{ fontSize: 20, transition: 'transform 0.3s ease', transform: showFilter ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              {hasActiveFilters && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -10,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: showFilter ? '#fff' : brand.primary,
                    color: showFilter ? brand.primary : '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {[selectedType !== '', priceRange[0] > 0, priceRange[1] < MAX_PRICE].filter(Boolean).length}
                </Box>
              )}
            </Box>
          </Fab>
        )}

        {/* Mobile list toggle */}
        {isMobile && filteredAds.length > 0 && (
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
              Liste ({filteredAds.length})
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{ width: 380, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid', borderColor: 'divider', p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {filteredAds.length} annonce{filteredAds.length !== 1 ? 's' : ''} à proximité
          </Typography>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <AdCardSkeleton key={idx} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAds.map((ad) => <AdCard key={ad.id} ad={ad} showDistance />)}
            </Box>
          )}
          {!isLoading && filteredAds.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
              {allAds.length > 0
                ? 'Aucune annonce ne correspond aux filtres sélectionnés.'
                : 'Aucune annonce dans ce rayon.'}
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
            <Typography variant="h6" fontWeight={600}>{filteredAds.length} annonce{filteredAds.length !== 1 ? 's' : ''}</Typography>
            <IconButton aria-label="Fermer la liste" onClick={() => setShowList(false)}><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredAds.map((ad) => <AdCard key={ad.id} ad={ad} showDistance />)}
          </Box>
        </Box>
      </Drawer>
    </Box>
    </MotionConfig>
  );
}
