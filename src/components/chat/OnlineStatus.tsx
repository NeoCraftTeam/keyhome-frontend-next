'use client';

import type { DeviceType, PresenceStatus } from '@/hooks/usePresence';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OnlineStatusProps {
  status: PresenceStatus;
  device?: DeviceType;
  lastSeenAt?: string | null;
  theme?: ChatTheme;
}

/**
 * Teal dot + device icon for online; gray dot for offline with "last seen" text.
 */
export function OnlineStatus({
  status,
  device,
  lastSeenAt,
  theme = CLIENT_THEME,
}: OnlineStatusProps) {
  const color = theme.accent;

  if (status === 'online') {
    return (
      <span
        className="flex items-center gap-1.5 text-[11.5px] font-medium"
        style={{ color }}
      >
        <span
          className="h-[6px] w-[6px] rounded-full inline-block shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}80` }}
        />
        En ligne
      </span>
    );
  }

  if (status === 'offline' && lastSeenAt) {
    const lastSeen = formatDistanceToNow(new Date(lastSeenAt), {
      addSuffix: true,
      locale: fr,
    });
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] text-gray-400">
        <span className="h-[6px] w-[6px] rounded-full bg-gray-300 inline-block shrink-0" />
        Vu {lastSeen}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-gray-400">
      <span className="h-[6px] w-[6px] rounded-full bg-gray-300 inline-block shrink-0" />
      Hors ligne
    </span>
  );
}
