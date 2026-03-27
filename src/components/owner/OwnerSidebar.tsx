'use client';

import { ownerService } from '@/services/owner.service';
import {
  AccountBalance as AccountBalanceIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  PeopleAlt as PeopleAltIcon,
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
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
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

interface OwnerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: 'Gestion',
    items: [
      {
        label: 'Dashboard',
        href: '/owner/dashboard',
        icon: <DashboardIcon fontSize="small" />,
      },
      {
        label: 'Mes Annonces',
        href: '/owner/ads',
        icon: <HomeIcon fontSize="small" />,
      },
      {
        label: 'Visites',
        href: '/owner/viewings',
        icon: <VisibilityIcon fontSize="small" />,
        badgeKey: 'viewings',
      },
      {
        label: 'Disponibilités',
        href: '/owner/availability',
        icon: <CalendarMonthIcon fontSize="small" />,
      },
      {
        label: 'Locataires',
        href: '/owner/tenants',
        icon: <PeopleAltIcon fontSize="small" />,
      },
      {
        label: 'Finances',
        href: '/owner/financials',
        icon: <AccountBalanceIcon fontSize="small" />,
      },
      {
        label: 'Contrats',
        href: '/owner/lease-contracts',
        icon: <DescriptionIcon fontSize="small" />,
      },
      {
        label: 'Avis',
        href: '/owner/reviews',
        icon: <RateReviewIcon fontSize="small" />,
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        label: 'Paiements',
        href: '/owner/payments',
        icon: <PaymentIcon fontSize="small" />,
      },
      {
        label: 'Abonnements',
        href: '/owner/subscriptions',
        icon: <SubscriptionsIcon fontSize="small" />,
      },
      {
        label: 'Services Pro',
        href: '/owner/pro-services',
        icon: <WorkspacePremiumIcon fontSize="small" />,
      },
    ],
  },
  {
    label: 'Compte',
    items: [
      {
        label: 'Profil',
        href: '/owner/profile',
        icon: <PersonIcon fontSize="small" />,
      },
      {
        label: 'Mon équipe',
        href: '/owner/equipe',
        icon: <GroupsIcon fontSize="small" />,
      },
      {
        label: 'Paramètres',
        href: '/owner/parametres',
        icon: <SettingsIcon fontSize="small" />,
      },
    ],
  },
];

export default function OwnerSidebar({
  collapsed,
  onToggle,
}: OwnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: pendingViewings } = useQuery({
    queryKey: ['owner', 'viewings', 'pending-count'],
    queryFn: () =>
      ownerService.getViewingReservations({ page: 1, status: 'pending' }),
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
        overflow: 'hidden',
      }}
    >
      {/* Logo + toggle */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          gap: 1,
        }}
      >
        {!collapsed && (
          <Box
            onClick={() => router.push('/owner/dashboard')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              minWidth: 0,
              flex: 1,
              '&:hover': { opacity: 0.85 },
            }}
          >
            <Image
              src="/images/logo-teal.png"
              alt="KeyHome"
              width={36}
              height={36}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary.main"
                noWrap
              >
                KeyHome
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
              >
                Panneau propriétaire
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box
            onClick={() => router.push('/owner/dashboard')}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
          >
            <Image
              src="/images/logo-teal.png"
              alt="KeyHome"
              width={32}
              height={32}
            />
          </Box>
        )}
        <Tooltip
          title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={onToggle}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              width: 28,
              height: 28,
              flexShrink: 0,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Nav sections */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          py: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
          <Box key={section.label}>
            {sectionIndex > 0 && (
              <Divider sx={{ my: 1, mx: collapsed ? 1 : 2 }} />
            )}
            {!collapsed && (
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
            )}
            <List disablePadding sx={{ px: collapsed ? 0.5 : 1 }}>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + '/');
                const badgeCount = getBadgeCount(item.badgeKey);
                return (
                  <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
                    <Tooltip
                      title={collapsed ? item.label : ''}
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        onClick={() => router.push(item.href)}
                        sx={{
                          borderRadius: 2,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          px: collapsed ? 1 : 2,
                          bgcolor: isActive
                            ? 'rgba(13, 148, 136, 0.12)'
                            : 'transparent',
                          color: isActive ? 'primary.main' : 'text.primary',
                          '&:hover': {
                            bgcolor: isActive
                              ? 'rgba(13, 148, 136, 0.18)'
                              : 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive ? 'primary.main' : 'text.secondary',
                            minWidth: collapsed ? 'auto' : 38,
                            justifyContent: 'center',
                          }}
                        >
                          <Badge
                            badgeContent={
                              badgeCount > 0 ? badgeCount : undefined
                            }
                            color="error"
                            max={99}
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.6rem',
                                height: 16,
                                minWidth: 16,
                              },
                            }}
                          >
                            {item.icon}
                          </Badge>
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* CTA */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {collapsed ? (
          <Tooltip title="Nouvelle annonce" placement="right" arrow>
            <IconButton
              color="primary"
              onClick={() => router.push('/owner/ads/new')}
              sx={{
                width: '100%',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <AddCircleOutlineIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => router.push('/owner/ads/new')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Nouvelle annonce
          </Button>
        )}
      </Box>
    </Box>
  );
}
