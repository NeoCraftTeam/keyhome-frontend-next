'use client';

import {
  getNotificationMessage,
  getOwnerNotificationHref,
  formatNotificationTime,
} from '@/lib/notification-routing';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type LaravelNotification,
} from '@/services/notifications.service';
import {
  CheckCircleOutline as CheckAllIcon,
  NotificationsNone as NotificationsNoneIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NOTIFICATIONS_QK = ['notifications', 'owner', 'recent'] as const;
const UNREAD_QK = ['notifications', 'owner', 'unread-count'] as const;

export default function OwnerNotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: UNREAD_QK,
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const {
    data: notifications = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: NOTIFICATIONS_QK,
    queryFn: async () => {
      const { data } = await fetchNotifications({ per_page: 15, unread_only: false });
      return data;
    },
    enabled: open,
    staleTime: 15_000,
  });

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

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClickNotification = async (n: LaravelNotification) => {
    if (!n.read_at) {
      markReadMutation.mutate(n.id);
    }
    const href = getOwnerNotificationHref(n);
    handleClose();
    if (href) {
      router.push(href);
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label="Notifications"
          onClick={handleOpen}
          color="inherit"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Badge
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
            color="error"
            overlap="circular"
            invisible={unreadCount === 0}
          >
            <NotificationsIcon sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: { xs: 'min(100vw - 32px, 380px)', sm: 380 },
              maxHeight: 480,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckAllIcon />}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Tout lu
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
          {isLoading || isFetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aucune notification pour le moment.
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItemButton
                key={n.id}
                alignItems="flex-start"
                onClick={() => void handleClickNotification(n)}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: n.read_at ? 'transparent' : 'action.hover',
                  borderLeft: '3px solid',
                  borderColor: n.read_at ? 'transparent' : 'primary.main',
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40, mt: 0.25 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: n.read_at ? 'action.selected' : 'primary.light',
                      opacity: n.read_at ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={n.read_at ? 500 : 700}
                      sx={{ lineHeight: 1.35 }}
                    >
                      {getNotificationMessage(n)}
                    </Typography>
                  }
                  secondary={formatNotificationTime(n.created_at)}
                  secondaryTypographyProps={{ variant: 'caption', sx: { mt: 0.5 } }}
                />
              </ListItemButton>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
}
