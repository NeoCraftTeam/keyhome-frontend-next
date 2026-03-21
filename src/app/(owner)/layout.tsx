'use client';

import OwnerLayoutClient from '@/components/owner/OwnerLayoutClient';
import { OwnerThemeProvider } from '@/providers/OwnerThemeProvider';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OwnerThemeProvider>
      <OwnerLayoutClient>{children}</OwnerLayoutClient>
    </OwnerThemeProvider>
  );
}
