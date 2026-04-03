'use client';

import {
  CalendarMonth as CalendarMonthIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Divider,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import type { User } from '@/types';

interface NavDesktopMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onLogoutClick: () => void;
  user: User | null;
}

export default function NavDesktopMenu({
  anchorEl,
  onClose,
  onNavigate,
  onLogoutClick,
  user,
}: NavDesktopMenuProps) {
  const navigate = (href: string) => {
    onClose();
    onNavigate(href);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      TransitionComponent={Fade}
      transitionDuration={220}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            '& .MuiMenuItem-root': {
              py: 1.15,
              transition: 'background-color 0.18s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Avatar
            src={user?.avatar || undefined}
            sx={{ width: 36, height: 36, bgcolor: 'text.secondary' }}
          >
            {user?.firstname?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.firstname} {user?.lastname}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <MenuItem onClick={() => navigate('/my/reservations')}>
        <ListItemIcon>
          <CalendarMonthIcon />
        </ListItemIcon>
        <ListItemText>Mes réservations</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => navigate('/notifications')}>
        <ListItemIcon>
          <NotificationsIcon />
        </ListItemIcon>
        <ListItemText>Notifications</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => navigate('/search-alerts')}>
        <ListItemIcon>
          <NotificationsActiveIcon />
        </ListItemIcon>
        <ListItemText>Alertes de recherche</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => navigate('/profile')}>
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText>Mon profil</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => navigate('/parametres')}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText>Paramètres</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => {
          onClose();
          onLogoutClick();
        }}
      >
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText>Déconnexion</ListItemText>
      </MenuItem>
    </Menu>
  );
}
