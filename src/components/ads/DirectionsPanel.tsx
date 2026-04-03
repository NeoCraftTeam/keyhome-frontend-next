'use client';

import {
  geoService,
  type DirectionsResult,
  type OrsProfile,
} from '@/services/geo.service';
import { useUserLocation } from '@/hooks/useUserLocation';
import {
  Accessible,
  DirectionsBike,
  DirectionsCar,
  DirectionsWalk,
  NavigationOutlined,
  Schedule,
  Straighten,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useCallback } from 'react';

// ─── Profile config ───────────────────────────────────────────────────────────

interface ProfileConfig {
  value: OrsProfile;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PROFILES: ProfileConfig[] = [
  {
    value: 'driving-car',
    label: 'Voiture',
    icon: <DirectionsCar sx={{ fontSize: 18 }} />,
    color: '#0284c7',
  },
  {
    value: 'foot-walking',
    label: 'À pied',
    icon: <DirectionsWalk sx={{ fontSize: 18 }} />,
    color: '#16a34a',
  },
  {
    value: 'cycling-regular',
    label: 'Vélo',
    icon: <DirectionsBike sx={{ fontSize: 18 }} />,
    color: '#d97706',
  },
  {
    value: 'wheelchair',
    label: 'Fauteuil',
    icon: <Accessible sx={{ fontSize: 18 }} />,
    color: '#7c3aed',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ result }: { result: DirectionsResult }) {
  const cfg = PROFILES.find((p) => p.value === result.profile)!;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.02)',
        mt: 1.5,
      }}
    >
      {/* Profile icon */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: alpha(cfg.color, 0.12),
          color: cfg.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </Box>

      {/* Stats */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: 10 }}
        >
          {cfg.label}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mt: 0.25,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 14, color: cfg.color }} />
            <Typography
              variant="body2"
              fontWeight={800}
              sx={{ color: cfg.color }}
            >
              {result.summary.duration_label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Straighten sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {result.summary.distance_label}
            </Typography>
          </Box>
        </Box>
      </Box>

      {result.cached && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: 9 }}
        >
          cache
        </Typography>
      )}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  adLat: number;
  adLng: number;
  /** Pass the already-fetched location to avoid a second geolocation request */
  userLocation?: import('@/hooks/useUserLocation').UserLocation | null;
}

export default function DirectionsPanel({
  adLat,
  adLng,
  userLocation: userLocationProp,
}: Props) {
  const { location: userLocationInternal } = useUserLocation();
  const userLocation = userLocationProp ?? userLocationInternal;

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<OrsProfile>('driving-car');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DirectionsResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const res = await geoService.getDirections(
        userLocation.latitude,
        userLocation.longitude,
        adLat,
        adLng,
        profile
      );
      // Replace or add the result for this profile
      setResults((prev) => {
        const filtered = prev.filter((r) => r.profile !== profile);
        return [...filtered, res.data];
      });
    } catch {
      setError("Calcul d'itinéraire indisponible. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [userLocation, adLat, adLng, profile]);

  const computeAll = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const fetches = PROFILES.slice(0, 3).map((p) =>
        geoService
          .getDirections(
            userLocation.latitude,
            userLocation.longitude,
            adLat,
            adLng,
            p.value
          )
          .then((res) => res.data)
          .catch(() => null)
      );

      const all = await Promise.all(fetches);
      const valid = all.filter((r): r is DirectionsResult => r !== null);
      setResults(valid);
      if (valid.length === 0) {
        setError(
          "Calcul d'itinéraire indisponible. Vérifiez que ORS_API_KEY est configuré."
        );
      }
    } catch {
      setError("Calcul d'itinéraire indisponible.");
    } finally {
      setLoading(false);
    }
  }, [userLocation, adLat, adLng]);

  if (!userLocation) return null;

  return (
    <Box sx={{ mt: 2 }}>
      {/* Trigger row */}
      <Box
        component="button"
        onClick={() => {
          setOpen((v) => {
            if (!v && results.length === 0) {
              computeAll();
            }
            return !v;
          });
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          p: 1.5,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: open ? 'primary.main' : 'divider',
          bgcolor: open
            ? (t) => alpha(t.palette.primary.main, 0.04)
            : (t) =>
                t.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.015)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <NavigationOutlined sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            Comment y aller ?
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 10 }}
          >
            {results.length > 0
              ? `${results.length} mode${results.length > 1 ? 's' : ''} calculé${results.length > 1 ? 's' : ''}`
              : 'Voiture · Pied · Vélo — depuis votre position'}
          </Typography>
        </Box>
        {loading && <CircularProgress size={16} />}
      </Box>

      {/* Expanded content */}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 0.5 }}>
          {error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 1 }}
            >
              {error}
            </Typography>
          )}

          {results.length > 0 && (
            <>
              {/* Sort: car first, then walking, then cycling */}
              {(
                [
                  'driving-car',
                  'foot-walking',
                  'cycling-regular',
                  'wheelchair',
                ] as OrsProfile[]
              )
                .map((p) => results.find((r) => r.profile === p))
                .filter((r): r is DirectionsResult => r !== undefined)
                .map((r) => (
                  <SummaryCard key={r.profile} result={r} />
                ))}
            </>
          )}

          {/* Recalculate for a specific profile */}
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={profile}
              exclusive
              onChange={(_, v) => {
                if (v) setProfile(v);
              }}
              size="small"
              sx={{
                flex: 1,
                '& .MuiToggleButton-root': { flex: 1, py: 0.4, fontSize: 10 },
              }}
            >
              {PROFILES.map((p) => (
                <Tooltip key={p.value} title={p.label} arrow>
                  <ToggleButton value={p.value} aria-label={p.label}>
                    {p.icon}
                  </ToggleButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>

            <Box
              component="button"
              onClick={compute}
              disabled={loading}
              sx={{
                py: 0.75,
                px: 1.5,
                bgcolor: 'primary.main',
                color: '#fff',
                border: 'none',
                borderRadius: 1.5,
                fontSize: 11,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s',
              }}
            >
              Calculer
            </Box>
          </Box>

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 1, fontSize: 9 }}
          >
            Itinéraires calculés via OpenRouteService · depuis votre position
            GPS
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
