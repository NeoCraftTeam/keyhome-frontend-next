'use client';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ExploreIcon from '@mui/icons-material/Explore';
import HomeIcon from '@mui/icons-material/Home';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import type { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

/** Items shown in BottomNav (PWA) — customer */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Comparer', href: '/comparaisons', icon: <CompareArrowsIcon /> },
  { label: 'Carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Prix', href: '/prix-marche', icon: <BarChartIcon /> },
  { label: 'Profil', href: '/profile', icon: <PersonIcon /> },
];

/** Items shown in sidebar (mobile browser, labels plus explicites) — exclut Comparer et Profil */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Explorer la carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Estimer le loyer', href: '/prix-marche', icon: <BarChartIcon /> },
];

/** Owner panel nav items — full list for sidebar and desktop nav */
export const OWNER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: <DashboardIcon /> },
  { label: 'Mes Annonces', href: '/owner/ads', icon: <HomeIcon /> },
  { label: 'Locataires', href: '/owner/tenants', icon: <PeopleAltIcon /> },
  {
    label: 'Finances',
    href: '/owner/financials',
    icon: <AccountBalanceIcon />,
  },
  {
    label: 'Contrats',
    href: '/owner/lease-contracts',
    icon: <DescriptionIcon />,
  },
  { label: 'Avis', href: '/owner/reviews', icon: <RateReviewIcon /> },
  { label: 'Visites', href: '/owner/viewings', icon: <VisibilityIcon /> },
  {
    label: 'Disponibilités',
    href: '/owner/availability',
    icon: <CalendarMonthIcon />,
  },
  { label: 'Paiements', href: '/owner/payments', icon: <PaymentIcon /> },
  {
    label: 'Abonnements',
    href: '/owner/subscriptions',
    icon: <SubscriptionsIcon />,
  },
  {
    label: 'Services Pro',
    href: '/owner/pro-services',
    icon: <WorkspacePremiumIcon />,
  },
  { label: 'Profil', href: '/owner/profile', icon: <PersonIcon /> },
  { label: 'Paramètres', href: '/owner/parametres', icon: <SettingsIcon /> },
];

/** Owner panel — subset for mobile BottomNav (max 5 items) */
export const OWNER_BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: <DashboardIcon /> },
  { label: 'Annonces', href: '/owner/ads', icon: <HomeIcon /> },
  {
    label: 'Disponibilités',
    href: '/owner/availability',
    icon: <CalendarMonthIcon />,
  },
  { label: 'Visites', href: '/owner/viewings', icon: <VisibilityIcon /> },
  { label: 'Profil', href: '/owner/profile', icon: <PersonIcon /> },
];

/** Owner panel — sidebar items (exclude Profil/Paramètres for main nav, they go in user menu) */
export const OWNER_SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: <DashboardIcon /> },
  { label: 'Mes Annonces', href: '/owner/ads', icon: <HomeIcon /> },
  { label: 'Locataires', href: '/owner/tenants', icon: <PeopleAltIcon /> },
  {
    label: 'Finances',
    href: '/owner/financials',
    icon: <AccountBalanceIcon />,
  },
  {
    label: 'Contrats',
    href: '/owner/lease-contracts',
    icon: <DescriptionIcon />,
  },
  { label: 'Avis', href: '/owner/reviews', icon: <RateReviewIcon /> },
  { label: 'Visites', href: '/owner/viewings', icon: <VisibilityIcon /> },
  {
    label: 'Disponibilités',
    href: '/owner/availability',
    icon: <CalendarMonthIcon />,
  },
  { label: 'Paiements', href: '/owner/payments', icon: <PaymentIcon /> },
  {
    label: 'Abonnements',
    href: '/owner/subscriptions',
    icon: <SubscriptionsIcon />,
  },
  {
    label: 'Services Pro',
    href: '/owner/pro-services',
    icon: <WorkspacePremiumIcon />,
  },
  { label: 'Profil', href: '/owner/profile', icon: <PersonIcon /> },
  { label: 'Paramètres', href: '/owner/parametres', icon: <SettingsIcon /> },
];
