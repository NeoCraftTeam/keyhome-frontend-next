'use client';

import type { ReactNode } from 'react';

interface ChatPageWrapperProps {
  children: ReactNode;
  className?: string;
  /**
   * Pass `true` when rendering inside the owner layout.
   * The owner layout is already a flex column with remaining height
   * (100vh − navbar), so we must NOT use a fixed calc() height.
   * Instead we use flex:1 + min-height:0 + overflow:hidden.
   */
  ownerLayout?: boolean;
}

/**
 * Full-height container for chat pages.
 *
 * Both client and owner layouts now use flex:1 + minHeight:0 + height:100%.
 * The parent layout (DashboardLayout or OwnerLayoutClient) is responsible
 * for constraining the outer box to the viewport height.
 */
export function ChatPageWrapper({
  children,
  className = '',
}: ChatPageWrapperProps) {
  return (
    <div
      className={`flex overflow-hidden ${className}`}
      style={{ flex: 1, minHeight: 0, height: '100%' }}
    >
      {children}
    </div>
  );
}
