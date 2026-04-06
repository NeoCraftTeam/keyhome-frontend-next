'use client';

import { adsService } from '@/services/ads.service';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import DirectionsBus from '@mui/icons-material/DirectionsBus';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import LocalHospital from '@mui/icons-material/LocalHospital';
import NearMe from '@mui/icons-material/NearMe';
import Restaurant from '@mui/icons-material/Restaurant';
import School from '@mui/icons-material/School';
import LocalPolice from '@mui/icons-material/LocalPolice';
import Storefront from '@mui/icons-material/Storefront';
import Info from '@mui/icons-material/Info';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Button,
  Chip,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NearestPoi {
  osm_id: string;
  name: string | null;
  distance_m: number;
  mode: 'walking' | 'air';
}

interface CategoryData {
  score: number;
  poi_count: number;
  label: string;
  radius_m: number;
  nearest_poi: NearestPoi | null;
}

interface ScorecardData {
  global_score: number;
  status: 'ok' | 'degraded' | 'unavailable';
  cached: boolean;
  computed_at: string | null;
  categories: Record<string, CategoryData>;
}

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryConfig {
  key: string;
  icon: ReactNode;
  color: string;
}

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    key: 'transport',
    icon: <DirectionsBus sx={{ fontSize: 18 }} />,
    color: '#0284c7',
  },
  {
    key: 'commerce',
    icon: <Storefront sx={{ fontSize: 18 }} />,
    color: '#d97706',
  },
  {
    key: 'sante',
    icon: <LocalHospital sx={{ fontSize: 18 }} />,
    color: '#dc2626',
  },
  {
    key: 'education',
    icon: <School sx={{ fontSize: 18 }} />,
    color: '#7c3aed',
  },
  {
    key: 'securite',
    icon: <LocalPolice sx={{ fontSize: 18 }} />,
    color: '#059669',
  },
  {
    key: 'vie_sociale',
    icon: <Restaurant sx={{ fontSize: 18 }} />,
    color: '#db2777',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 25) return '#ea580c';
  return '#dc2626';
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 80;
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <Box
      sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          style={{ color: 'rgba(0,0,0,0.08)' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={800}
          lineHeight={1}
          color={color}
        >
          {score}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          lineHeight={1}
          sx={{ fontSize: 9 }}
        >
          /100
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  cfg,
  data,
}: {
  cfg: CategoryConfig;
  data: CategoryData;
}) {
  const poi = data.nearest_poi;
  const radiusLabel =
    data.radius_m >= 1000 ? `${data.radius_m / 1000} km` : `${data.radius_m} m`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      {/* Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1.5,
          flexShrink: 0,
          mt: 0.2,
          bgcolor: alpha(cfg.color, 0.12),
          color: cfg.color,
        }}
      >
        {cfg.icon}
      </Box>

      {/* Label + bar + poi */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: 0.4,
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.primary"
            noWrap
          >
            {data.label}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, ml: 1, fontSize: 10 }}
          >
            {data.poi_count} POI · {radiusLabel}
          </Typography>
        </Box>

        {/* Progress bar */}
        <Box
          sx={{
            height: 5,
            borderRadius: 99,
            bgcolor: (t) =>
              t.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.07)',
            overflow: 'hidden',
            mb: 0.6,
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${data.score}%`,
              borderRadius: 99,
              bgcolor: cfg.color,
              transition: 'width 0.5s ease',
            }}
          />
        </Box>

        {/* Nearest POI */}
        {poi ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {poi.mode === 'walking' ? (
              <DirectionsWalk sx={{ fontSize: 12, color: 'text.disabled' }} />
            ) : (
              <NearMe sx={{ fontSize: 11, color: 'text.disabled' }} />
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontSize: 10 }}
            >
              {poi.name ? `${poi.name} · ` : ''}
              {formatDistance(poi.distance_m)}
              {poi.mode === 'air' && (
                <Box component="span" sx={{ color: 'warning.main', ml: 0.5 }}>
                  à vol d&apos;oiseau
                </Box>
              )}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: 10 }}
          >
            Aucun POI trouvé dans le rayon
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ScorecardSkeleton() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="55%" height={24} />
          <Skeleton variant="text" width="75%" height={18} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      {[...Array(6)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
          <Skeleton
            variant="rounded"
            width={32}
            height={32}
            sx={{ flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={14} />
            <Skeleton
              variant="rounded"
              width="100%"
              height={5}
              sx={{ my: 0.5, borderRadius: 99 }}
            />
            <Skeleton variant="text" width="60%" height={12} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  adId: string;
}

export default function NeighborhoodScorecard({ adId }: Props) {
  const [forceKey, setForceKey] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['neighborhood-scorecard', adId, forceKey],
    queryFn: () => adsService.getNeighborhoodScorecard(adId, forceKey > 0),
    staleTime: 1000 * 60 * 60 * 6,
    retry: 1,
  });

  const scorecard: ScorecardData | null = data?.data ?? null;
  const totalPoi = scorecard
    ? Object.values(scorecard.categories).reduce((s, c) => s + c.poi_count, 0)
    : 0;

  const globalLabel = !scorecard
    ? ''
    : scorecard.global_score >= 75
      ? 'Excellent quartier'
      : scorecard.global_score >= 50
        ? 'Bon quartier'
        : scorecard.global_score >= 25
          ? 'Quartier correct'
          : 'Peu de données OSM';

  return (
    <Box>
      {/* Section header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: (t) =>
              t.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(0,0,0,0.05)',
          }}
        >
          <Storefront sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Scorecard de quartier
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            Transport, commerces, santé, éducation — données OpenStreetMap
          </Typography>
        </Box>
        <Tooltip
          title="Scores calculés depuis OpenStreetMap Overpass. Les données varient selon la couverture cartographique locale. Les distances sont pédestres (ORS) ou à vol d'oiseau si non disponibles."
          arrow
        >
          <Info
            sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer' }}
          />
        </Tooltip>
      </Box>

      {isLoading && <ScorecardSkeleton />}

      {isError && (
        <Box sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Données de quartier non disponibles.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setForceKey((k) => k + 1)}
          >
            Réessayer
          </Button>
        </Box>
      )}

      {scorecard && (
        <>
          {/* Global score row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ScoreRing score={scorecard.global_score} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {globalLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalPoi} point{totalPoi !== 1 ? 's' : ''} d&apos;intérêt à
                proximité
              </Typography>
              {scorecard.status === 'degraded' && (
                <Chip
                  icon={<WarningAmberRounded sx={{ fontSize: 13 }} />}
                  label="Distances à vol d'oiseau (ORS indisponible)"
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontSize: 10,
                    height: 20,
                    maxWidth: '100%',
                    bgcolor: 'warning.light',
                    color: 'warning.dark',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              )}
              {scorecard.status === 'unavailable' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mt: 0.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    icon={<WarningAmberRounded sx={{ fontSize: 13 }} />}
                    label="Données OSM indisponibles"
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 20,
                      maxWidth: '100%',
                      bgcolor: 'error.light',
                      color: 'error.dark',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{ height: 20, fontSize: 10, px: 1, minWidth: 0 }}
                    onClick={() => setForceKey((k) => k + 1)}
                  >
                    Réessayer
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Category rows */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATEGORY_CONFIG.map((cfg) => {
              const cat = scorecard.categories[cfg.key];
              if (!cat) return null;
              return <CategoryRow key={cfg.key} cfg={cfg} data={cat} />;
            })}
          </Box>

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}
          >
            Source : OpenStreetMap · Mis à jour le{' '}
            {scorecard.computed_at
              ? new Date(scorecard.computed_at).toLocaleDateString('fr-FR')
              : '—'}
          </Typography>
        </>
      )}
    </Box>
  );
}
