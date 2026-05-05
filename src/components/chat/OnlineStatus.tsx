'use client';

import type { DeviceType, PresenceStatus } from '@/hooks/usePresence';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import {
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  startOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface OnlineStatusProps {
  status: PresenceStatus;
  device?: DeviceType;
  lastSeenAt?: string | null;
  theme?: ChatTheme;
}

/**
 * Picks the freshest timestamp for "Vu …" when merging API `last_seen_at` with
 * real-time thread activity (e.g. last inbound message). Conversation payloads
 * are often stale while the message list updates via WebSocket.
 */
export function resolvePeerLastSeenForDisplay(
  serverLastSeen: string | null | undefined,
  messageActivityAt: string | null | undefined
): string | null {
  const parseMs = (s: string): number => {
    const t = Date.parse(s);
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  };

  const a =
    typeof serverLastSeen === 'string' && serverLastSeen.trim() !== ''
      ? serverLastSeen
      : null;
  const b =
    typeof messageActivityAt === 'string' && messageActivityAt.trim() !== ''
      ? messageActivityAt
      : null;

  if (a === null && b === null) {
    return null;
  }
  if (a === null) {
    return b;
  }
  if (b === null) {
    return a;
  }

  return parseMs(a) >= parseMs(b) ? a : b;
}

/**
 * Format a "last seen" timestamp for the chat header (French).
 *
 * Shown as `Vu …` in the UI, so strings are written to read naturally after "Vu":
 * - &lt; 1 min → "à l'instant"
 * - &lt; 60 min → "il y a 12 min"
 * - same calendar day → "auj. à 18:42"
 * - yesterday → "hier à 22:14"
 * - 2–6 calendar days → "il y a 3 jours à 09:15"
 * - older → "le 12/01/2006 à 14:30"
 */
export function formatLastSeenShort(lastSeenAt: string): string {
  const now = new Date();
  const seenAt = new Date(lastSeenAt);
  const timePart = format(seenAt, 'HH:mm', { locale: fr });

  const minutes = differenceInMinutes(now, seenAt);
  if (minutes < 1) {
    return "à l'instant";
  }
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const calDays = differenceInCalendarDays(startOfDay(now), startOfDay(seenAt));

  if (calDays < 0) {
    return `le ${format(seenAt, 'dd/MM/yyyy', { locale: fr })} à ${timePart}`;
  }

  if (calDays === 0) {
    return `auj. à ${timePart}`;
  }

  if (calDays === 1) {
    return `hier à ${timePart}`;
  }

  if (calDays < 7) {
    return `il y a ${calDays} jours à ${timePart}`;
  }

  return `le ${format(seenAt, 'dd/MM/yyyy', { locale: fr })} à ${timePart}`;
}

/**
 * Accent dot + label for online; gray dot for offline with "last seen" text.
 */
export function OnlineStatus({
  status,
  device,
  lastSeenAt,
  theme = CLIENT_THEME,
}: OnlineStatusProps) {
  void device;
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
