'use client';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ExploreIcon from '@mui/icons-material/Explore';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchIcon from '@mui/icons-material/Search';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SettingsIcon from '@mui/icons-material/Settings';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import type { ReactNode } from 'react';
import { ChatBadgeIcon } from '@/components/chat/ChatBadgeIcon';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

/** PWA standalone bottom tabs only (hidden in mobile browser). Order matches native shell. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Messages', href: '/messages', icon: <ChatBadgeIcon /> },
  {
    label: 'Accueil',
    href: '/home',
    icon: <HomeRoundedIcon sx={{ fontSize: 26 }} />,
  },
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Comparer', href: '/comparaisons', icon: <CompareArrowsIcon /> },
];

/**
 * Authenticated drawer quick links (browser + PWA) — native-style order.
 * Accueil uses `brandHome` and is rendered with the KeyHome mark in {@link NavDrawer}.
 */
export type DrawerQuickNavEntry =
  | { label: string; href: string; icon: ReactNode; brandHome?: false }
  | { label: string; href: '/home'; brandHome: true };

export const AUTH_DRAWER_QUICK_NAV: DrawerQuickNavEntry[] = [
  { label: 'Carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Messages', href: '/messages', icon: <ChatBadgeIcon /> },
  { label: 'Accueil', href: '/home', brandHome: true },
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Comparer', href: '/comparaisons', icon: <CompareArrowsIcon /> },
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
  {
    label: 'Mes Annonces',
    href: '/owner/ads',
    icon: <ViewListRoundedIcon fontSize="small" />,
  },
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

/** Owner PWA standalone tab bar only — not shown in mobile browser tabs. */
export const OWNER_BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    label: 'Annonces',
    href: '/owner/ads',
    icon: <ViewListRoundedIcon />,
  },
  { label: 'Messages', href: '/owner/messages', icon: <ChatBadgeIcon /> },
  {
    label: 'Accueil',
    href: '/owner/dashboard',
    icon: <HomeRoundedIcon />,
  },
  { label: 'Visites', href: '/owner/viewings', icon: <VisibilityIcon /> },
  {
    label: 'Disponibilités',
    href: '/owner/availability',
    icon: <CalendarMonthIcon />,
  },
];

/** Owner panel — sidebar items (exclude Profil/Paramètres for main nav, they go in user menu) */
export const OWNER_SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: <DashboardIcon /> },
  {
    label: 'Mes Annonces',
    href: '/owner/ads',
    icon: <ViewListRoundedIcon fontSize="small" />,
  },
  { label: 'Messages', href: '/owner/messages', icon: <ChatBadgeIcon /> },
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
