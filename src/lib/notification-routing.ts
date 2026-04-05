import type { LaravelNotification } from '@/services/notifications.service';

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/**
 * Lien cible dans le panneau propriétaire (Next) à partir du payload Laravel.
 */
export function getOwnerNotificationHref(
  n: LaravelNotification
): string | null {
  const data = n.data;
  const type = n.type;

  const adId = str(data.ad_id);
  if (
    adId &&
    (type.includes('Ad') ||
      type.includes('Review') ||
      str(data.type)?.includes('ad'))
  ) {
    return `/owner/ads/${adId}`;
  }

  if (
    type.includes('Reservation') ||
    type.includes('Viewing') ||
    str(data.type)?.includes('viewing') ||
    data.reservation_id != null
  ) {
    return '/owner/viewings';
  }

  if (type.includes('Payment') || type.includes('Subscription')) {
    if (type.includes('Subscription')) {
      return '/owner/subscriptions';
    }
    return '/owner/payments';
  }

  if (type.includes('SearchAlert')) {
    return '/owner/ads';
  }

  return null;
}

export function getNotificationMessage(n: LaravelNotification): string {
  const msg = str(n.data.message);
  if (msg) {
    return msg;
  }
  const title = str(n.data.title);
  if (title) {
    return title;
  }
  const shortType = n.type.split('\\').pop() ?? n.type;
  return shortType.replace(/([A-Z])/g, ' $1').trim();
}

export function formatNotificationTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
