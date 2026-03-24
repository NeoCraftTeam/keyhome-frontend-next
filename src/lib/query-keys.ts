/**
 * Centralized query key factory for TanStack Query.
 *
 * Usage:
 *   import { ownerKeys, creditsKeys } from '@/lib/query-keys';
 *   useQuery({ queryKey: ownerKeys.ads.list(params), ... })
 *   queryClient.invalidateQueries({ queryKey: ownerKeys.ads.all })
 */

// ── Owner Panel ───────────────────────────────────────────────────────────────

export const ownerKeys = {
  all: ['owner'] as const,

  analytics: {
    all: ['owner-analytics'] as const,
    byPeriod: (period: string) => ['owner-analytics', period] as const,
  },

  ads: {
    all: ['owner-ads'] as const,
    list: (filters: Record<string, unknown>) =>
      ['owner-ads', ...Object.values(filters)] as const,
    total: ['owner-ads-total'] as const,
    recent: ['owner-ads-recent'] as const,
    allForSelect: ['owner-ads-all'] as const,
  },

  viewings: {
    all: ['owner-viewing-reservations'] as const,
    list: (page: number, status: string) =>
      ['owner-viewing-reservations', page, status] as const,
    recent: ['owner-viewings-recent'] as const,
  },

  availability: {
    all: ['owner-availability'] as const,
    byAd: (adId: string | null) => ['owner-availability', adId] as const,
  },

  leaseContracts: {
    all: ['owner-lease-contracts'] as const,
    list: (page: number) => ['owner-lease-contracts', page] as const,
  },

  reviews: {
    all: ['owner-reviews'] as const,
    list: (page: number) => ['owner-reviews', page] as const,
  },

  profile: {
    cities: (input: string) => ['owner-profile-cities', input] as const,
  },
} as const;

// ── Shared / Global ───────────────────────────────────────────────────────────

export const creditsKeys = {
  all: ['credits'] as const,
  balance: ['credits-balance'] as const,
  packages: ['credits-packages'] as const,
} as const;

export const paymentKeys = {
  all: ['payment'] as const,
  history: (page: number) => ['payment-history', page] as const,
} as const;

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  current: ['subscriptions-current'] as const,
  plans: ['subscriptions-plans'] as const,
} as const;

export const notificationKeys = {
  all: ['notifications'] as const,
  owner: ['notifications', 'owner'] as const,
  unreadCount: (scope: string) => ['notifications', scope, 'unread-count'] as const,
  recent: (scope: string) => ['notifications', scope, 'recent'] as const,
} as const;

// ── Login History ───────────────────────────────────────────────────────────

export const loginHistoryKeys = {
  all: ['login-history'] as const,
  list: (page: number) => ['login-history', page] as const,
} as const;

// ── Team ─────────────────────────────────────────────────────────────────────

export const teamKeys = {
  all: ['team'] as const,
} as const;

// ── E-Signature ───────────────────────────────────────────────────────────────

export const signatureRequestKeys = {
  list: (leaseContractId: string) => ['signature-requests', leaseContractId] as const,
} as const;

// ── Ad Form ───────────────────────────────────────────────────────────────────────

export const adFormKeys = {
  cities: (input: string) => ['ad-form-cities', input] as const,
  quarters: (cityId: string | undefined, input: string) =>
    ['ad-form-quarters', cityId, input] as const,
} as const;

// ── Reference Data ────────────────────────────────────────────────────────────

export const referenceKeys = {
  cities: ['cities-list'] as const,
  adTypes: ['ad-types'] as const,
} as const;
