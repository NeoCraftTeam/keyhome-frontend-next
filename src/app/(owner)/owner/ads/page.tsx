'use client';

import BoostPurchaseDialog from '@/components/owner/BoostPurchaseDialog';
import OwnerAdCard from '@/components/owner/OwnerAdCard';
import PublishingOverlay from '@/components/owner/PublishingOverlay';
import QrCodeDialog from '@/components/owner/QrCodeDialog';
import ShareAdButtons from '@/components/owner/ShareAdButtons';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { ShimmerBox } from '@/components/ui/ShimmerCard';
import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { formatPrice } from '@/lib/constants';
import { runAppRouterNavigation } from '@/lib/safe-app-router-push';
import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { ownerService } from '@/services/owner.service';
import { neutral } from '@/theme/tokens';
import { Ad, AdStatus, AdType, City } from '@/types';
import {
  Add as AddIcon,
  Description as ContractIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  VisibilityOff as HiddenIcon,
  HomeOutlined as HomeOutlinedIcon,
  MoreVert as MoreIcon,
  QrCode2 as QrCodeIcon,
  RocketLaunch as RocketLaunchIcon,
  Visibility as VisibleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const MotionTableRow = motion(TableRow);

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Réservé' },
  { value: 'rent', label: 'En location' },
  { value: 'pending', label: 'En attente' },
  { value: 'sold', label: 'Vendu' },
  { value: 'declined', label: 'Refusé' },
];

export default function OwnerAdsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [boostFeedback, setBoostFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [boostDialogAd, setBoostDialogAd] = useState<Ad | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      'owner-ads',
      page + 1,
      rowsPerPage,
      search,
      statusFilter,
      cityFilter,
      typeFilter,
      sort,
      order,
    ],
    queryFn: ({ signal }) =>
      ownerService.getMyAds(
        {
          page: page + 1,
          per_page: rowsPerPage,
          q: search || undefined,
          status: statusFilter || undefined,
          city_id: cityFilter || undefined,
          type_id: typeFilter || undefined,
          sort,
          order,
        },
        { signal }
      ),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['cities-list'],
    queryFn: ({ signal }) => citiesService.list({ per_page: 200 }, { signal }),
  });

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: adTypesData } = useQuery({
    queryKey: ['ad-types'],
    queryFn: ({ signal }) => adTypesService.list({ signal }),
  });

  // Draft query — fetch up to 20 so we can render the pinned "Brouillons" section
  const { data: draftData } = useQuery({
    queryKey: ['owner-ads', 'drafts'],
    queryFn: ({ signal }) =>
      ownerService.getMyAds(
        { page: 1, per_page: 20, status: 'draft' },
        { signal }
      ),
  });
  const draftAds = (draftData?.data ?? []) as Ad[];
  const draftCount = draftData?.meta?.total ?? 0;

  const toggleMutation = useMutation({
    mutationFn: (adId: string) => adsService.toggleVisibility(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setAnchorEl(null);
      setSelectedAd(null);
    },
    onError: (err: unknown) => {
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de modifier la visibilité.'
        ),
        severity: 'error',
      });
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ adId, status }: { adId: string; status: string }) =>
      adsService.setStatus(adId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setAnchorEl(null);
      setSelectedAd(null);
    },
    onError: (err: unknown) => {
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de mettre à jour le statut.'
        ),
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (adId: string) => adsService.destroy(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setAnchorEl(null);
      setSelectedAd(null);
    },
    onError: (err: unknown) => {
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de supprimer cette annonce.'
        ),
        severity: 'error',
      });
    },
  });

  const publishDraftMutation = useMutation({
    mutationFn: (adId: string) => adsService.publishDraft(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setAnchorEl(null);
      setSelectedAd(null);
    },
    onError: (err: unknown) => {
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de publier le brouillon.'
        ),
        severity: 'error',
      });
    },
  });

  const unboostMutation = useMutation({
    mutationFn: (adId: string) => adsService.unboost(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: 'Boost retiré.',
        severity: 'success',
      });
    },
    onError: (err: unknown) => {
      setAnchorEl(null);
      setSelectedAd(null);
      setBoostFeedback({
        message: getLaravelApiErrorMessage(
          err,
          'Impossible de retirer le boost.'
        ),
        severity: 'error',
      });
    },
  });

  const adsRowActionPending =
    toggleMutation.isPending ||
    setStatusMutation.isPending ||
    deleteMutation.isPending ||
    publishDraftMutation.isPending ||
    unboostMutation.isPending;

  const handleSort = useCallback(
    (field: string) => {
      if (sort === field) {
        setOrder(order === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(field);
        setOrder('desc');
      }
    },
    [sort, order]
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ad: Ad) => {
    setAnchorEl(event.currentTarget);
    setSelectedAd(ad);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAd(null);
  };

  const ads = (data?.data ?? []) as Ad[];
  const meta = data?.meta;
  const cities = (citiesData?.data ?? []) as City[];
  const adTypes = (adTypesData ?? []) as AdType[];

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/owner/dashboard' },
          { label: 'Mes annonces' },
        ]}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Mes{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            Annonces
          </Box>
        </Typography>
        {draftCount > 0 && (
          <Chip
            label={`${draftCount} brouillon${draftCount > 1 ? 's' : ''}`}
            color="secondary"
            size="small"
            onClick={() => {
              setStatusFilter('draft');
              setPage(0);
            }}
            sx={{ fontWeight: 700, cursor: 'pointer' }}
          />
        )}
      </Box>

      {/* ── Pinned drafts section ── */}
      {draftAds.length > 0 && statusFilter !== 'draft' && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'warning.200',
            borderRadius: 2,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: 'warning.50',
              borderBottom: '1px solid',
              borderColor: 'warning.200',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <EditIcon sx={{ color: 'warning.700', fontSize: 20 }} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="warning.800"
            >
              {draftCount} brouillon{draftCount > 1 ? 's' : ''} en cours
            </Typography>
            <Typography variant="caption" color="warning.600" sx={{ ml: 0.5 }}>
              — Cliquez sur &quot;Continuer&quot; pour reprendre la rédaction
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {draftAds.map((draft, idx) => (
              <Box
                key={draft.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 1.5,
                  borderBottom:
                    idx < draftAds.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'grey.50' },
                  transition: 'background-color 0.15s',
                }}
              >
                {/* Thumbnail */}
                <Box
                  sx={{
                    width: 56,
                    height: 42,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    flexShrink: 0,
                  }}
                >
                  {draft.images?.[0]?.thumb || draft.images?.[0]?.url ? (
                    <Box
                      component="img"
                      src={draft.images[0].thumb || draft.images[0].url}
                      alt={draft.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      <AddIcon sx={{ fontSize: 20, opacity: 0.4 }} />
                    </Box>
                  )}
                </Box>
                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    color={draft.title ? 'text.primary' : 'text.disabled'}
                  >
                    {draft.title || 'Sans titre'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Modifié le{' '}
                    {new Date(draft.updated_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label="Brouillon"
                    size="small"
                    sx={{
                      bgcolor: 'warning.100',
                      color: 'warning.800',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                  <Box
                    component="button"
                    onClick={() =>
                      runAppRouterNavigation(router, `/owner/ads/${draft.id}`)
                    }
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 1.5,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      px: 2,
                      py: 0.75,
                      border: 'none',
                      cursor: 'pointer',
                      bgcolor: 'warning.600',
                      color: neutral.white,
                      '&:hover': { bgcolor: 'warning.700' },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    Continuer →
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ overflow: 'hidden', mb: 4 }}>
        <Box
          sx={{
            p: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'minmax(200px, 1fr) repeat(3, auto)',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Rechercher titre, adresse…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">🔍</InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
            <InputLabel>Ville</InputLabel>
            <Select
              value={cityFilter}
              label="Ville"
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Toutes</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              {adTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? (
          <Box sx={{ p: 2.5 }}>
            {/* Shimmer skeleton rows for both mobile and desktop */}
            {isMobile ? (
              <Grid container spacing={2}>
                {[1, 2, 4, 5, 6].map((i) => (
                  <Grid key={i} size={{ xs: 6 }}>
                    <ShimmerBox
                      height={0}
                      sx={{
                        paddingTop: '100%',
                        height: 'auto',
                        borderRadius: '12px',
                      }}
                    />
                    <ShimmerBox
                      height={13}
                      width="75%"
                      sx={{ mt: 1, mb: 0.5 }}
                    />
                    <ShimmerBox height={11} width="55%" />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    <ShimmerBox width={64} height={48} borderRadius={8} />
                    <Box sx={{ flex: 1 }}>
                      <ShimmerBox height={13} width="50%" sx={{ mb: 0.5 }} />
                      <ShimmerBox height={11} width="35%" />
                    </Box>
                    <ShimmerBox width={60} height={20} borderRadius={10} />
                    <ShimmerBox width={40} height={32} borderRadius={6} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : isError ? (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              sx={{ borderRadius: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  sx={{
                    minHeight: 44,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Réessayer
                </Button>
              }
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Impossible de charger vos annonces
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vérifiez votre connexion réseau, puis réessayez.
              </Typography>
            </Alert>
          </Box>
        ) : ads.length === 0 ? (
          <EmptyState
            variant="owner"
            size="md"
            icon={<AddIcon sx={{ fontSize: 30 }} />}
            title={
              search || statusFilter || cityFilter || typeFilter
                ? 'Aucun résultat pour ces critères'
                : 'Aucune annonce'
            }
            description={
              search || statusFilter || cityFilter || typeFilter
                ? 'Modifiez vos filtres ou créez une nouvelle annonce.'
                : 'Créez votre première annonce pour commencer à louer vos biens.'
            }
            action={{
              label: 'Ajouter une annonce',
              href: '/owner/ads/new',
            }}
          />
        ) : isMobile ? (
          <Box sx={{ pb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                gap: 2,
                px: 2,
                py: 1,
                /* hide scrollbar but keep scroll */
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {ads.map((ad) => (
                <Box
                  key={ad.id}
                  sx={{
                    flex: '0 0 72%',
                    maxWidth: 280,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <OwnerAdCard
                    ad={ad}
                    onToggleVisibility={(a) => toggleMutation.mutate(a.id)}
                    isToggling={toggleMutation.isPending}
                    onShowQrCode={(a) => {
                      setSelectedAd(a);
                      setQrDialogOpen(true);
                    }}
                  />
                </Box>
              ))}
            </Box>
            {meta && meta.last_page > 1 && (
              <TablePagination
                component="div"
                count={meta.total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page"
              />
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 120 }}>Photos</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sort === 'title'}
                        direction={sort === 'title' ? order : 'desc'}
                        onClick={() => handleSort('title')}
                      >
                        Titre
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Adresse</TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sort === 'price'}
                        direction={sort === 'price' ? order : 'desc'}
                        onClick={() => handleSort('price')}
                      >
                        Prix
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sort === 'surface_area'}
                        direction={sort === 'surface_area' ? order : 'desc'}
                        onClick={() => handleSort('surface_area')}
                      >
                        m²
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="center">Visible</TableCell>
                    <TableCell align="center" sx={{ width: 56 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ads.map((ad, rowIndex) => {
                    const images = ad.images ?? [];
                    return (
                      <MotionTableRow
                        key={ad.id}
                        hover
                        layout={false}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: Math.min(rowIndex * 0.04, 0.45),
                          duration: 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() =>
                          !adsRowActionPending &&
                          runAppRouterNavigation(router, `/owner/ads/${ad.id}`)
                        }
                      >
                        <TableCell sx={{ py: 1, width: 72 }}>
                          <AvatarGroup
                            max={3}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 36,
                                height: 36,
                                fontSize: '0.75rem',
                                border: '2px solid',
                                borderColor: 'background.paper',
                              },
                            }}
                          >
                            {images.length > 0 ? (
                              images.map((img, idx) => (
                                <Avatar
                                  key={img.id ?? idx}
                                  src={img.thumb || img.url}
                                  alt={`${ad.title} ${idx + 1}`}
                                  variant="rounded"
                                />
                              ))
                            ) : (
                              <Avatar
                                variant="rounded"
                                alt={ad.title}
                                sx={{ bgcolor: 'grey.200', color: 'grey.500' }}
                              >
                                <HomeOutlinedIcon fontSize="small" />
                              </Avatar>
                            )}
                          </AvatarGroup>
                        </TableCell>
                        <TableCell sx={{ minWidth: 0, maxWidth: 200 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ minWidth: 0, maxWidth: 200 }}
                          >
                            {ad.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 160 }}
                          >
                            {ad.adresse}
                          </Typography>
                          {ad.quarter?.city_name && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {ad.quarter.city_name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="primary.main"
                          >
                            {ad.price != null ? formatPrice(ad.price) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {ad.surface_area}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              ad.status === AdStatus.DRAFT
                                ? 'Brouillon'
                                : ad.status_label || ad.status
                            }
                            size="small"
                            color={
                              ad.status === AdStatus.AVAILABLE
                                ? 'success'
                                : ad.status === AdStatus.RESERVED ||
                                    ad.status === AdStatus.PENDING
                                  ? 'warning'
                                  : ad.status === AdStatus.RENT ||
                                      ad.status === AdStatus.SOLD
                                    ? 'info'
                                    : ad.status === AdStatus.DRAFT
                                      ? 'secondary'
                                      : 'default'
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {ad.is_visible !== false ? (
                            <VisibleIcon fontSize="small" color="action" />
                          ) : (
                            <HiddenIcon fontSize="small" color="disabled" />
                          )}
                        </TableCell>
                        <TableCell
                          align="center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconButton
                            size="small"
                            aria-label={`Actions pour ${ad.title}`}
                            disabled={adsRowActionPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, ad);
                            }}
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </MotionTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {meta && (
              <TablePagination
                component="div"
                count={meta.total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page"
              />
            )}
          </>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedAd && (
          <>
            <MenuItem
              onClick={() => {
                runAppRouterNavigation(router, `/owner/ads/${selectedAd.id}`);
                handleMenuClose();
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedAd.status === AdStatus.DRAFT
                ? "Continuer l'édition"
                : 'Modifier'}
            </MenuItem>
            {selectedAd.status === AdStatus.DRAFT && (
              <MenuItem
                onClick={() => {
                  publishDraftMutation.mutate(selectedAd.id);
                }}
                disabled={publishDraftMutation.isPending}
                sx={{ color: 'primary.main', fontWeight: 600 }}
              >
                <VisibleIcon fontSize="small" sx={{ mr: 1 }} />
                Publier l&apos;annonce
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                toggleMutation.mutate(selectedAd.id);
              }}
              disabled={toggleMutation.isPending}
            >
              {selectedAd.is_visible !== false ? (
                <>
                  <HiddenIcon fontSize="small" sx={{ mr: 1 }} />
                  Masquer
                </>
              ) : (
                <>
                  <VisibleIcon fontSize="small" sx={{ mr: 1 }} />
                  Afficher
                </>
              )}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setQrDialogOpen(true);
              }}
            >
              <QrCodeIcon fontSize="small" sx={{ mr: 1 }} />
              QR code & pancarte
            </MenuItem>
            {selectedAd.status !== AdStatus.PENDING &&
              selectedAd.status !== AdStatus.DECLINED && (
                <>
                  {selectedAd.status !== AdStatus.RESERVED && (
                    <MenuItem
                      onClick={() => {
                        setStatusMutation.mutate({
                          adId: selectedAd.id,
                          status: AdStatus.RESERVED,
                        });
                      }}
                      disabled={setStatusMutation.isPending}
                    >
                      Marquer réservé
                    </MenuItem>
                  )}
                  {selectedAd.status !== AdStatus.AVAILABLE && (
                    <MenuItem
                      onClick={() => {
                        setStatusMutation.mutate({
                          adId: selectedAd.id,
                          status: AdStatus.AVAILABLE,
                        });
                      }}
                      disabled={setStatusMutation.isPending}
                    >
                      Marquer disponible
                    </MenuItem>
                  )}
                </>
              )}
            {(selectedAd.status === AdStatus.AVAILABLE ||
              selectedAd.status === AdStatus.RESERVED) && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  runAppRouterNavigation(router, `/owner/ads/${selectedAd.id}`);
                }}
              >
                <ContractIcon fontSize="small" sx={{ mr: 1 }} />
                Générer un contrat
              </MenuItem>
            )}
            {selectedAd.status === AdStatus.AVAILABLE &&
              (selectedAd.is_boosted ? (
                <MenuItem
                  onClick={() => unboostMutation.mutate(selectedAd.id)}
                  disabled={unboostMutation.isPending}
                >
                  <RocketLaunchIcon fontSize="small" sx={{ mr: 1 }} />
                  Retirer le boost
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setBoostDialogAd(selectedAd);
                  }}
                  sx={{ color: 'primary.main', fontWeight: 600 }}
                >
                  <RocketLaunchIcon fontSize="small" sx={{ mr: 1 }} />
                  Booster cette annonce
                </MenuItem>
              ))}
            <MenuItem
              onClick={async () => {
                handleMenuClose();
                const ok = await confirm({
                  title: 'Supprimer cette annonce ?',
                  message:
                    'Cette action est irréversible. L’annonce et toutes ses photos seront définitivement supprimées.',
                  confirmLabel: 'Supprimer',
                  variant: 'danger',
                });
                if (ok) {
                  deleteMutation.mutate(selectedAd.id);
                }
              }}
              disabled={deleteMutation.isPending}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Supprimer
            </MenuItem>
            <Box
              sx={{
                px: 2,
                py: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ShareAdButtons
                adTitle={selectedAd.title}
                adUrl={`/ads/${selectedAd.slug || selectedAd.id}`}
              />
            </Box>
          </>
        )}
      </Menu>
      <QrCodeDialog
        open={qrDialogOpen}
        onClose={() => {
          setQrDialogOpen(false);
          setSelectedAd(null);
        }}
        variant="ad"
        ad={
          selectedAd
            ? { id: selectedAd.id, title: selectedAd.title }
            : undefined
        }
      />
      <Snackbar
        open={!!boostFeedback}
        autoHideDuration={4500}
        onClose={() => setBoostFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {boostFeedback ? (
          <Alert
            severity={boostFeedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
            onClose={() => setBoostFeedback(null)}
          >
            {boostFeedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
      {boostDialogAd && (
        <BoostPurchaseDialog
          open={!!boostDialogAd}
          onClose={() => setBoostDialogAd(null)}
          adId={boostDialogAd.id}
          adTitle={boostDialogAd.title ?? 'Annonce'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['owner-ads'] });
            setBoostFeedback({
              message:
                'Annonce boostée ! Elle remonte maintenant en tête des résultats.',
              severity: 'success',
            });
          }}
        />
      )}
      {/* Desktop FAB — mobile uses OwnerLayoutClient shell FAB (shouldShowOwnerQuickCreateFab) */}
      {!isMobile && (
        <Fab
          color="primary"
          variant="extended"
          aria-label="Nouvelle annonce"
          onClick={() => runAppRouterNavigation(router, '/owner/ads/new')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: (t) => t.zIndex.appBar,
            boxShadow: 4,
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Nouvelle annonce
        </Fab>
      )}
      {/* ═══ Deletion overlay ═══ */}
      <PublishingOverlay
        open={deleteMutation.isPending}
        title="Suppression en cours…"
        subtitle="Ne quittez pas cette page — votre annonce est en cours de suppression."
        Icon={DeleteIcon}
        accentColor="#d32f2f"
      />
    </Box>
  );
}
