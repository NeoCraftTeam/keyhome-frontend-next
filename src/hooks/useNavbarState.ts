'use client';

import { useComparator } from '@/providers/ComparatorProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface NavbarState {
  anchorEl: HTMLElement | null;
  mobileOpen: boolean;
  logoutOpen: boolean;
  comparatorCount: number;
  openDesktopMenu: (e: React.MouseEvent<HTMLElement>) => void;
  closeDesktopMenu: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  openLogout: () => void;
  closeLogout: () => void;
  isActive: (href: string) => boolean;
  showComparatorBadge: (href: string) => boolean;
}

/**
 * Encapsulates all UI state and derived helpers for the main Navbar.
 *
 * Extracted from Navbar.tsx to keep the component focused on rendering.
 * No side-effects or data-fetching — pure UI state.
 */
export function useNavbarState(): NavbarState {
  const pathname = usePathname();
  const { items: comparatorItems } = useComparator();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return {
    anchorEl,
    mobileOpen,
    logoutOpen,
    comparatorCount: comparatorItems.length,
    openDesktopMenu: (e) => setAnchorEl(e.currentTarget),
    closeDesktopMenu: () => setAnchorEl(null),
    openDrawer: () => setMobileOpen(true),
    closeDrawer: () => setMobileOpen(false),
    openLogout: () => setLogoutOpen(true),
    closeLogout: () => setLogoutOpen(false),
    isActive: (href) =>
      pathname === href || (pathname?.startsWith(href + '/') ?? false),
    showComparatorBadge: (href) =>
      href === '/comparaisons' && comparatorItems.length > 0,
  };
}
