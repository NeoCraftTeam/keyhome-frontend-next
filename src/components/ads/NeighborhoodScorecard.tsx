'use client';

import { adsService } from '@/services/ads.service';
import { useQuery } from '@tanstack/react-query';
import {
  DirectionsBus,
  LocalHospital,
  School,
  Storefront,
  LocalPolice,
  Restaurant,
  Info,
} from '@mui/icons-material';
import {
  Box,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryData {
  score: number;
  poi_count: number;
  label: string;
  radius_m: number;
}

interface ScorecardData {
  global_score: number;
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
  { key: 'transport',   icon: <DirectionsBus sx={{ fontSize: 18 }} />, color: '#0284c7' },
  { key: 'commerce',    icon: <Storefront    sx={{ fontSize: 18 }} />, color: '#d97706' },
  { key: 'sante',       icon: <LocalHospital sx={{ fontSize: 18 }} />, color: '#dc2626' },
  { key: 'education',   icon: <School        sx={{ fontSize: 18 }} />, color: '#7c3aed' },
  { key: 'securite',    icon: <LocalPolice   sx={{ fontSize: 18 }} />, color: '#059669' },
  { key: 'vie_sociale', icon: <Restaurant    sx={{ fontSize: 18 }} />, color: '#db2777' },
];

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size   = 80;
  const stroke = 7;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (score / 100) * circ;

  const color =
    score >= 75 ? '#16a34a' :
    score >= 50 ? '#ca8a04' :
    score >= 25 ? '#ea580c' :
                  '#dc2626';

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          style={{ color: 'rgba(0,0,0,0.08)' }}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} lineHeight={1} color={color}>
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary" lineHeight={1} sx={{ fontSize: 9 }}>
          /100
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Single category row ──────────────────────────────────────────────────────

function CategoryRow({ cfg, data }: { cfg: CategoryConfig; data: CategoryData }) {
  const radiusLabel = data.radius_m >= 1000
    ? `${data.radius_m / 1000} km`
    : `${data.radius_m} m`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Icon */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
          bgcolor: alpha(cfg.color, 0.12),
          color: cfg.color,
        }}
      >
        {cfg.icon}
      </Box>

      {/* Label + bar */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography variant="caption" fontWeight={600} color="text.primary" noWrap>
            {data.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
            {data.poi_count} POI · {radiusLabel}
          </Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 99, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
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
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Skeleton variant="rounded" width={32} height={32} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="rounded" width="100%" height={6} sx={{ mt: 0.5, borderRadius: 99 }} />
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ['neighborhood-scorecard', adId],
    queryFn: () => adsService.getNeighborhoodScorecard(adId),
    staleTime: 1000 * 60 * 60 * 6, // 6 h — backend caches 7 days
    retry: 1,
  });

  const scorecard: ScorecardData | null = data?.data ?? null;

  const globalLabel =
    !scorecard          ? '' :
    scorecard.global_score >= 75 ? 'Excellent quartier' :
    scorecard.global_score >= 50 ? 'Bon quartier' :
    scorecard.global_score >= 25 ? 'Quartier correct' :
                                   'Peu de données OSM';

  return (
    <Box>
      {/* Section header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 2,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <Storefront sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Scorecard de quartier
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Transport, commerces, santé, éducation — données OpenStreetMap
          </Typography>
        </Box>
        <Tooltip title="Scores calculés depuis OpenStreetMap Overpass. Les données varient selon la couverture cartographique locale." arrow>
          <Info sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer' }} />
        </Tooltip>
      </Box>

      {isLoading && <ScorecardSkeleton />}

      {isError && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Données de quartier non disponibles pour cette annonce.
        </Typography>
      )}

      {scorecard && (
        <>
          {/* Global score + summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ScoreRing score={scorecard.global_score} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {globalLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Score global basé sur {Object.values(scorecard.categories).reduce((s, c) => s + c.poi_count, 0)} points
                d&apos;intérêt à proximité
              </Typography>
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

          {/* Footer note */}
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
