'use client';

import {
  BarChart as BarChartIcon,
  CompareArrows as CompareArrowsIcon,
  Explore as ExploreIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

/** Items shown in BottomNav (PWA) */
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
