'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/echo';
import { useEffect, useState } from 'react';

export type PresenceStatus = 'online' | 'offline' | 'unknown';
export type DeviceType = 'mobile' | 'desktop' | null;

type PresenceMember = { id: string; info?: { device?: string } };

/**
 * Track online/offline status and device type for a specific user via the presence channel.
 *
 * Returns `{ status, device }` where:
 *  - `status`: 'online' | 'offline' | 'unknown'
 *  - `device`: 'mobile' | 'desktop' | null (null when offline/unknown)
 */
export function usePresence(userId: string): {
  status: PresenceStatus;
  device: DeviceType;
} {
  /**
   * Lazy initializer: if GlobalPresenceChannel has already subscribed to
   * `online-users`, resolve the status synchronously so the very first render
   * shows the correct state and there is no flickering "Vu à" frame.
   */
  const [status, setStatus] = useState<PresenceStatus>(() => {
    if (!userId || !isReverbRealtimeConfigured()) return 'unknown';
    try {
      const echo = getEcho();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch = (echo.connector as any).pusher?.channel(
        'presence-online-users'
      );
      if (!ch?.subscribed || !ch?.members || ch.members.count === 0)
        return 'unknown';
      let found = false;
      ch.members.each((m: PresenceMember) => {
        if (String(m.id) === String(userId)) found = true;
      });
      return found ? 'online' : 'offline';
    } catch {
      return 'unknown';
    }
  });
  const [device, setDevice] = useState<DeviceType>(() => {
    if (!userId || !isReverbRealtimeConfigured()) return null;
    try {
      const echo = getEcho();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch = (echo.connector as any).pusher?.channel(
        'presence-online-users'
      );
      if (!ch?.subscribed || !ch?.members || ch.members.count === 0)
        return null;
      let found: DeviceType = null;
      ch.members.each((m: PresenceMember) => {
        if (String(m.id) === String(userId))
          found =
            m.info?.device === 'mobile'
              ? 'mobile'
              : m.info?.device === 'desktop'
                ? 'desktop'
                : null;
      });
      return found;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!userId) return;
    if (!isReverbRealtimeConfigured()) return;

    const echo = getEcho();

    // GlobalPresenceChannel owns the `online-users` subscription.
    // We tap into the underlying Pusher channel directly so we can
    // bind/unbind per-user handlers without calling echo.leave()
    // (which would destroy the shared subscription).
    const channelName = 'presence-online-users';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pusherChannel = (echo.connector as any).pusher?.channel(channelName);

    // If GlobalPresenceChannel hasn't subscribed yet, ensure the channel exists.
    if (!pusherChannel) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[usePresence] Channel not found, joining online-users for',
          userId
        );
      }
      echo.join('online-users');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pusherChannel = (echo.connector as any).pusher?.channel(channelName);
    }

    if (!pusherChannel) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[usePresence] Could not get pusher channel for online-users'
        );
      }
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const resolveDevice = (info?: { device?: string }): DeviceType =>
      info?.device === 'mobile'
        ? 'mobile'
        : info?.device === 'desktop'
          ? 'desktop'
          : null;

    // Robust member check — uses members.each() with String() coercion
    // to avoid ID type mismatches between Pusher and our UUID strings.
    const checkMembers = (): boolean => {
      if (!pusherChannel.subscribed || !pusherChannel.members) return false;
      let found = false;
      let foundDevice: DeviceType = null;
      pusherChannel.members.each((member: PresenceMember) => {
        if (String(member.id) === String(userId)) {
          found = true;
          foundDevice = resolveDevice(member.info);
        }
      });
      setStatus(found ? 'online' : 'offline');
      setDevice(found ? foundDevice : null);
      return true;
    };

    // Bind directly to Pusher events (not through Echo wrappers)
    // so we can unbind by exact function reference on cleanup.
    // Handlers are bound BEFORE the immediate check so we never miss
    // the subscription_succeeded event due to a race with GlobalPresenceChannel.
    const onSubscribed = () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[usePresence] Channel subscribed, checking members for',
          userId
        );
      }
      checkMembers();
    };
    const onAdded = (member: PresenceMember) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[usePresence] Member added:',
          member.id,
          'looking for:',
          userId
        );
      }
      if (String(member.id) === String(userId)) {
        setStatus('online');
        setDevice(resolveDevice(member.info));
      }
    };
    const onRemoved = (member: PresenceMember) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[usePresence] Member removed:',
          member.id,
          'looking for:',
          userId
        );
      }
      if (String(member.id) === String(userId)) {
        setStatus('offline');
        setDevice(null);
      }
    };

    pusherChannel.bind('pusher:subscription_succeeded', onSubscribed);
    pusherChannel.bind('pusher:member_added', onAdded);
    pusherChannel.bind('pusher:member_removed', onRemoved);

    // Check current members immediately if already subscribed.
    // If not subscribed yet, retry after a short delay to handle the
    // race where GlobalPresenceChannel is still connecting.
    if (!checkMembers()) {
      retryTimer = setTimeout(() => checkMembers(), 500);
    }

    return () => {
      // Unbind only our handlers — NEVER call echo.leave('online-users')
      pusherChannel.unbind('pusher:subscription_succeeded', onSubscribed);
      pusherChannel.unbind('pusher:member_added', onAdded);
      pusherChannel.unbind('pusher:member_removed', onRemoved);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [userId]);

  return { status, device };
}
