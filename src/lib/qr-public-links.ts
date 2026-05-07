import { absoluteUrl } from '@/lib/site-url';

export function adPublicPath(slugOrId: string): string {
  return `/ads/${slugOrId}`;
}

export function landlordPublicPath(username: string): string {
  return `/bailleurs/${username.trim()}`;
}

export function absoluteAdUrl(slugOrId: string): string {
  return absoluteUrl(adPublicPath(slugOrId));
}

export function absoluteLandlordUrl(username: string): string {
  return absoluteUrl(landlordPublicPath(username));
}
