'use client';

import FadeIn from '@/components/ui/layout/FadeIn';
import SearchAlertDigestCard from '@/components/notifications/SearchAlertDigestCard';
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type LaravelNotification,
} from '@/services/notifications.service';
import {
  formatNotificationTime,
  getNotificationMessage,
} from '@/lib/notification-routing';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import { useAuth } from '@/providers/AuthProvider';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChatIcon from '@mui/icons-material/Chat';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StarIcon from '@mui/icons-material/Star';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Pagination,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NOTIFICATIONS_QK = ['notifications', 'center'] as const;
const UNREAD_QK = ['notifications', 'center', 'unread-count'] as const;

function getNotificationIcon(type: string): React.ReactNode {
  if (type.includes('Payment') || type.includes('Subscription')) {
    return <CreditCardIcon sx={{ fontSize: '1.1rem' }} />;
  }
  if (type.includes('Ad')) {
    return <ApartmentIcon sx={{ fontSize: '1.1rem' }} />;
  }
  if (type.includes('Review')) {
    return <StarIcon sx={{ fontSize: '1.1rem' }} />;
  }
  if (type.includes('SearchAlert') || type === 'search_alert_digest') {
    return <NotificationsActiveIcon sx={{ fontSize: '1.1rem' }} />;
  }
  if (type.includes('Message')) {
    return <ChatIcon sx={{ fontSize: '1.1rem' }} />;
  }
  return <CampaignIcon sx={{ fontSize: '1.1rem' }} />;
}

function getNotificationHref(n: LaravelNotification): string | null {
  const data = n.data;
  const adId = typeof data.ad_id === 'string' ? data.ad_id : null;
  const adSlug = typeof data.ad_slug === 'string' ? data.ad_slug : null;

  if (adId) {
    return `/ads/${adId}/${adSlug || adId}`;
  }
  if (n.type.includes('Payment')) {
    return '/payments';
  }
  if (
    n.type.includes('SearchAlert') ||
    String(data.type) === 'search_alert_digest'
  ) {
    return '/search-alerts';
  }
  return null;
}

function isDigest(n: LaravelNotification): boolean {
  return String(n.data.type) === 'search_alert_digest';
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [...UNREAD_QK],
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: [...NOTIFICATIONS_QK, tab, page],
    queryFn: () =>
      fetchNotifications({
        per_page: perPage,
        unread_only: tab === 'unread',
      }),
    staleTime: 15_000,
    enabled: isAuthenticated,
  });

  const notifications = notificationsData?.data ?? [];
  const totalPages = notificationsData?.meta?.last_page ?? 1;

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QK });
      void queryClient.invalidateQueries({ queryKey: UNREAD_QK });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QK });
      void queryClient.invalidateQueries({ queryKey: UNREAD_QK });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QK });
      void queryClient.invalidateQueries({ queryKey: UNREAD_QK });
    },
  });

  const handleClick = (n: LaravelNotification) => {
    if (!n.read_at) {
      markReadMutation.mutate(n.id);
    }
    const href = getNotificationHref(n);
    if (href) {
      router.push(href);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <NotificationsNoneIcon
          sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
        />
        <Typography variant="h6" color="text.secondary">
          Connectez-vous pour voir vos notifications
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Accueil', href: '/home' },
          { label: 'Notifications' },
        ]}
      />
      <FadeIn direction="up" delay={0.05}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => router.back()}
              aria-label="Retour"
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            </Badge>
            <Typography variant="h5" fontWeight={700}>
              Notifications
            </Typography>
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={
                markAllMutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <DoneAllIcon />
                )
              }
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Tout marquer comme lu
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setPage(1);
          }}
          sx={{ mb: 2 }}
        >
          <Tab
            value="all"
            label="Toutes"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            value="unread"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Non lues
                {unreadCount > 0 && (
                  <Chip
                    label={unreadCount}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                )}
              </Box>
            }
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>

        {/* Content */}
        <Paper
          elevation={0}
          aria-live="polite"
          aria-atomic="true"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsNoneIcon
                sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }}
              />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                {tab === 'unread'
                  ? 'Aucune notification non lue'
                  : 'Aucune notification'}
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ mt: 0.5 }}
              >
                {tab === 'unread'
                  ? 'Toutes vos notifications ont été lues'
                  : 'Vos notifications apparaîtront ici'}
              </Typography>
            </Box>
          ) : (
            <List
              disablePadding
              aria-label="Liste des notifications"
              role="list"
            >
              {notifications.map((n, idx) => (
                <Box key={n.id} role="listitem">
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Supprimer">
                        <IconButton
                          edge="end"
                          aria-label="Supprimer la notification"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(n.id);
                          }}
                          disabled={deleteMutation.isPending}
                          sx={{
                            color: 'text.disabled',
                            '&:hover': { color: 'error.main' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    {isDigest(n) ? (
                      /* ── Digest card (expandable, non-navigating) ── */
                      <Box
                        onClick={() => {
                          if (!n.read_at) markReadMutation.mutate(n.id);
                        }}
                        sx={{
                          px: 2,
                          py: 1.5,
                          width: '100%',
                          bgcolor: n.read_at ? 'transparent' : 'action.hover',
                          cursor: 'default',
                        }}
                      >
                        <SearchAlertDigestCard
                          message={String(n.data.message ?? '')}
                          totalAds={Number(n.data.total_ads ?? 0)}
                          groups={
                            (n.data.groups as Parameters<
                              typeof SearchAlertDigestCard
                            >[0]['groups']) ?? []
                          }
                          isUnread={!n.read_at}
                        />
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ mt: 0.75, display: 'block' }}
                        >
                          {formatNotificationTime(n.created_at)}
                        </Typography>
                      </Box>
                    ) : (
                      /* ── Standard notification row ── */
                      <ListItemButton
                        onClick={() => handleClick(n)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          bgcolor: n.read_at ? 'transparent' : 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: n.read_at
                                ? 'action.disabledBackground'
                                : 'primary.50',
                              width: 40,
                              height: 40,
                              fontSize: '1.2rem',
                            }}
                          >
                            {getNotificationIcon(n.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontWeight={n.read_at ? 400 : 600}
                              sx={{
                                color: n.read_at
                                  ? 'text.secondary'
                                  : 'text.primary',
                                pr: 4,
                              }}
                            >
                              {getNotificationMessage(n)}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.disabled">
                              {formatNotificationTime(n.created_at)}
                            </Typography>
                          }
                        />
                        {!n.read_at && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              flexShrink: 0,
                              mr: 4,
                            }}
                          />
                        )}
                      </ListItemButton>
                    )}
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                },
              }}
            />
          </Box>
        )}
      </FadeIn>
    </Container>
  );
}
