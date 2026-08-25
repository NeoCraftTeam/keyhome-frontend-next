'use client';

import { buildAuthUrlWithReturnTo } from '@/lib/auth/return-to';
import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import SearchAlertButton from '@/components/ads/SearchAlertButton';
import { gradient } from '@/theme/tokens';
import type { Ad, AdType, City, FacetsResponse } from '@/types';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import {
  Box,
  Button,
  Chip,
  Grid,
  Menu,
  MenuItem,
  Pagination,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

/** Sort option descriptor. */
interface SortOption {
  label: string;
  sb: string;
  so: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { label: 'Pertinence', sb: 'boost_score', so: 'desc' },
  { label: 'Plus récents', sb: 'created_at', so: 'desc' },
  { label: 'Prix croissant', sb: 'price', so: 'asc' },
  { label: 'Prix décroissant', sb: 'price', so: 'desc' },
  { label: 'Surface croissante', sb: 'surface_area', so: 'asc' },
  { label: 'Surface décroissante', sb: 'surface_area', so: 'desc' },
  { label: 'Mieux notés', sb: 'reviews_avg_rating', so: 'desc' },
  { label: 'Populaires', sb: 'views_count', so: 'desc' },
  { label: 'Distance', sb: '_geoPoint', so: 'asc' },
];

interface Props {
  ads: Ad[];
  total: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
  sortAnchor: HTMLElement | null;
  setSortAnchor: (el: HTMLElement | null) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  sortLabel: string;
  setPage: (v: number) => void;
  isAuthenticated: boolean;
  selectedCity: City | null;
  setCityInput: (v: string) => void;
  setSelectedCity: (v: City | null) => void;
  clearFilters: () => void;
  facets?: FacetsResponse;
  selectedType: AdType | null;
  setSelectedType: (v: AdType | null) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
}

/**
 * The results pane of the search page: sort controls, ad grid, pagination,
 * and empty/error states.
 *
 * Extracted from page.tsx for readability and to allow memo() to prevent
 * unnecessary re-renders when only unrelated filter state changes.
 */
const SearchResultsList = memo(function SearchResultsList({
  ads,
  total,
  totalPages,
  page,
  isLoading,
  isFetching,
  isError,
  refetch,
  sortAnchor,
  setSortAnchor,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  sortLabel,
  setPage,
  isAuthenticated,
  selectedCity,
  setCityInput,
  setSelectedCity,
  clearFilters,
  facets,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
}: Props) {
  const router = useRouter();

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        px: { xs: 2, md: 2.5 },
        pt: 1.5,
        pb: { xs: 4, md: 4 },
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
      }}
    >
      {/* Top bar: result count + sort */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pt: 0.5,
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: '0.85rem' }}
          aria-live="polite"
          aria-atomic="true"
        >
          {isFetching && !isLoading ? (
            'Mise à jour…'
          ) : (
            <>
              <strong style={{ color: 'inherit', fontWeight: 800 }}>
                {total.toLocaleString('fr-FR')}
              </strong>{' '}
              annonce{total > 1 ? 's' : ''}
            </>
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

        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem
              key={opt.label}
              selected={sortBy === opt.sb && sortOrder === opt.so}
              onClick={() => {
                setSortBy(opt.sb);
                setSortOrder(opt.so);
                setPage(1);
                setSortAnchor(null);
              }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* States: loading, error, empty, results */}
      {isLoading ? (
        <Grid container spacing={1.5}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 6, lg: 4, xl: 3 }}>
              <AdCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : isError ? (
        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, px: 3 }}>
          <WifiOffIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography
            variant="h6"
            component="h2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Connexion interrompue
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}
          >
            Nous n&apos;avons pas pu charger les annonces. Vérifiez votre
            connexion et réessayez.
          </Typography>
          <Button
            variant="contained"
            onClick={() => refetch()}
            sx={{
              textTransform: 'none',
              borderRadius: 99,
              fontWeight: 700,
              px: 4,
              background: (t) =>
                t.palette.gradient?.primary ?? gradient.primary,
            }}
          >
            Réessayer
          </Button>
        </Box>
      ) : ads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, px: 3 }}>
          <SearchOffIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography
            variant="h6"
            component="h2"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Pas encore d&apos;annonces ici
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}
          >
            Aucun bien ne correspond à ces critères pour le moment.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}
          >
            Créez une alerte et soyez notifié dès qu&apos;un bien est publié, ou
            élargissez votre recherche.
          </Typography>

          {/* Smart suggestions */}
          {(facets?.cities?.length ||
            selectedType ||
            priceRange[1] < 5000000) && (
            <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 600,
                }}
              >
                Suggestions
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'center',
                }}
              >
                {/* Suggest removing type filter */}
                {selectedType && (
                  <Chip
                    size="small"
                    label={`Tous types (pas seulement ${selectedType.name})`}
                    onClick={() => {
                      setSelectedType(null);
                      setPage(1);
                    }}
                    variant="outlined"
                    sx={{ borderRadius: 99, fontSize: 12 }}
                  />
                )}
                {/* Suggest expanding budget by 20% */}
                {priceRange[1] < 4000000 && (
                  <Chip
                    size="small"
                    label={`Budget +20 % (${((priceRange[1] * 1.2) / 1000).toFixed(0)}k FCFA max)`}
                    onClick={() => {
                      setPriceRange([
                        priceRange[0],
                        Math.round(priceRange[1] * 1.2),
                      ]);
                      setPage(1);
                    }}
                    variant="outlined"
                    sx={{ borderRadius: 99, fontSize: 12 }}
                  />
                )}
                {/* Suggest other active cities from facets */}
                {facets?.cities
                  ?.filter((c) => c.name !== selectedCity?.name && c.count > 0)
                  .slice(0, 3)
                  .map((c) => (
                    <Chip
                      key={c.name}
                      size="small"
                      label={`${c.name} (${c.count})`}
                      onClick={() => {
                        setCityInput(c.name);
                        setSelectedCity({
                          id: '',
                          name: c.name,
                          slug: '',
                        } as City);
                        setPage(1);
                      }}
                      variant="outlined"
                      sx={{ borderRadius: 99, fontSize: 12 }}
                    />
                  ))}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {isAuthenticated ? (
              <SearchAlertButton
                prefill={{ city_name: selectedCity?.name }}
                variant="button"
                sx={{
                  textTransform: 'none',
                  borderRadius: 99,
                  fontWeight: 700,
                  px: 3,
                  background: (t) =>
                    t.palette.gradient?.primary ?? gradient.primary,
                  color: 'white',
                  border: 'none',
                  '&:hover': {
                    background: (t) =>
                      t.palette.gradient?.primaryHover ?? gradient.primaryHover,
                    border: 'none',
                  },
                }}
              />
            ) : (
              <Button
                variant="contained"
                onClick={() =>
                  router.push(
                    buildAuthUrlWithReturnTo(
                      '/login',
                      'client',
                      `/search${typeof window !== 'undefined' ? window.location.search : ''}`
                    )
                  )
                }
                sx={{
                  textTransform: 'none',
                  borderRadius: 99,
                  fontWeight: 700,
                  px: 3,
                  background: (t) =>
                    t.palette.gradient?.primary ?? gradient.primary,
                  '&:hover': {
                    background: (t) =>
                      t.palette.gradient?.primaryHover ?? gradient.primaryHover,
                  },
                }}
              >
                Se connecter pour créer une alerte
              </Button>
            )}
            <Button
              variant="contained"
              onClick={clearFilters}
              sx={{
                textTransform: 'none',
                borderRadius: 99,
                fontWeight: 700,
                px: 3,
                background: (t) =>
                  t.palette.gradient?.primary ?? gradient.primary,
                '&:hover': {
                  background: (t) =>
                    t.palette.gradient?.primaryHover ?? gradient.primaryHover,
                },
              }}
            >
              Voir toutes les annonces
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
                  borderRadius: 99,
                  fontWeight: 600,
                }}
              >
                Changer de ville
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <>
          <Grid container spacing={1.5}>
            {ads.map((ad, idx) => (
              <Grid key={ad.id} size={{ xs: 6, lg: 4, xl: 3 }}>
                {/* Transform+opacity only — no `layout`/stagger so re-filtering
                    the grid stays composited (no per-card FLIP reflow on mobile). */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <AdCard ad={ad} priority={idx < 4} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

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
});

export default SearchResultsList;
