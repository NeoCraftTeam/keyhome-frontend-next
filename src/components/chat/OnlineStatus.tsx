'use client';

import type { DeviceType, PresenceStatus } from '@/hooks/usePresence';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isToday,
  isYesterday,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface OnlineStatusProps {
  status: PresenceStatus;
  device?: DeviceType;
  lastSeenAt?: string | null;
  theme?: ChatTheme;
}

/**
 * Format a "last seen" timestamp the WhatsApp way: short, dense, French.
 *
 * - < 1 min   → "à l'instant"
 * - < 60 min  → "il y a 12 min"
 * - same day  → "à 18:42"
 * - yesterday → "hier à 22:14"
 * - < 7 days  → "il y a 3 jours"
 * - older     → "le 12 mars"
 */
export function formatLastSeenShort(lastSeenAt: string): string {
  const now = new Date();
  const seenAt = new Date(lastSeenAt);

  const minutes = differenceInMinutes(now, seenAt);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  if (isToday(seenAt)) {
    return `à ${format(seenAt, 'HH:mm', { locale: fr })}`;
  }

  if (isYesterday(seenAt)) {
    return `hier à ${format(seenAt, 'HH:mm', { locale: fr })}`;
  }

  const hours = differenceInHours(now, seenAt);
  if (hours < 24) return `il y a ${hours} h`;

  const days = differenceInDays(now, seenAt);
  if (days === 1) return 'il y a 1 jour';
  if (days < 7) return `il y a ${days} jours`;

  return `le ${format(seenAt, 'd MMM', { locale: fr })}`;
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
  void device; // reserved for future device-icon variant
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

  const offlineColor = theme.textMuted;
  const dotColor = theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)';

  if (status === 'offline' && lastSeenAt) {
    return (
      <span
        className="flex items-center gap-1.5 text-[11.5px]"
        style={{ color: offlineColor }}
      >
        <span
          className="h-[6px] w-[6px] rounded-full inline-block shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        Vu {formatLastSeenShort(lastSeenAt)}
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1.5 text-[11.5px]"
      style={{ color: offlineColor }}
    >
      <span
        className="h-[6px] w-[6px] rounded-full inline-block shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      Hors ligne
    </span>
  );
}
