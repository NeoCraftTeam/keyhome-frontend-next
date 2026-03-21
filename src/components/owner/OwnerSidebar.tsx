'use client';

import { ownerService } from '@/services/owner.service';
import {
  AddCircleOutline as AddCircleOutlineIcon,
  CalendarMonth as CalendarMonthIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  RateReview as RateReviewIcon,
  Settings as SettingsIcon,
  Subscriptions as SubscriptionsIcon,
  Visibility as VisibilityIcon,
  WorkspacePremium as WorkspacePremiumIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: 'viewings';
}

interface SidebarSection {
  label: string;
  items: SidebarNavItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: 'Gestion',
    items: [
      { label: 'Dashboard', href: '/owner/dashboard', icon: <DashboardIcon fontSize="small" /> },
      { label: 'Mes Annonces', href: '/owner/ads', icon: <HomeIcon fontSize="small" /> },
      { label: 'Visites', href: '/owner/viewings', icon: <VisibilityIcon fontSize="small" />, badgeKey: 'viewings' },
      { label: 'Disponibilités', href: '/owner/availability', icon: <CalendarMonthIcon fontSize="small" /> },
      { label: 'Contrats', href: '/owner/lease-contracts', icon: <DescriptionIcon fontSize="small" /> },
      { label: 'Avis', href: '/owner/reviews', icon: <RateReviewIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Paiements', href: '/owner/payments', icon: <PaymentIcon fontSize="small" /> },
      { label: 'Abonnements', href: '/owner/subscriptions', icon: <SubscriptionsIcon fontSize="small" /> },
      { label: 'Services Pro', href: '/owner/pro-services', icon: <WorkspacePremiumIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Compte',
    items: [
      { label: 'Profil', href: '/owner/profile', icon: <PersonIcon fontSize="small" /> },
      { label: 'Paramètres', href: '/owner/parametres', icon: <SettingsIcon fontSize="small" /> },
    ],
  },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: pendingViewings } = useQuery({
    queryKey: ['owner', 'viewings', 'pending-count'],
    queryFn: () => ownerService.getViewingReservations({ page: 1, status: 'pending' }),
    select: (res) => res.meta?.total ?? 0,
    staleTime: 60_000,
  });

  const getBadgeCount = (badgeKey?: string): number => {
    if (badgeKey === 'viewings') return pendingViewings ?? 0;
    return 0;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          onClick={() => router.push('/owner/dashboard')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.85 },
          }}
        >
          <Image src="/images/logo-teal.png" alt="KeyHome" width={36} height={36} />
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            KeyHome
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Panneau propriétaire
        </Typography>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
          <Box key={section.label}>
            {sectionIndex > 0 && <Divider sx={{ my: 1, mx: 2 }} />}
            <Typography
              variant="overline"
              sx={{
                px: 2.5,
                py: 0.5,
                display: 'block',
                color: 'text.disabled',
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              {section.label}
            </Typography>
            <List disablePadding sx={{ px: 1 }}>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/');
                const badgeCount = getBadgeCount(item.badgeKey);
                return (
                  <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => router.push(item.href)}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
                        color: isActive ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(13, 148, 136, 0.18)' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 38 }}
                      >
                        <Badge
                          badgeContent={badgeCount > 0 ? badgeCount : undefined}
                          color="error"
                          max={99}
                          sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                        >
                          {item.icon}
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* CTA */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => router.push('/owner/ads/new')}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Nouvelle annonce
        </Button>
      </Box>
    </Box>
  );
}
