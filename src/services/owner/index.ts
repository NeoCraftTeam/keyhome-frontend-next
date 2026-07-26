/**
 * Owner services barrel — re-exports all domain services.
 *
 * Use the specific domain imports for new code:
 *   import { ownerAdsService } from '@/services/owner/owner-ads.service'
 *
 * This barrel keeps existing callers of `ownerService.*` working unchanged
 * by spreading all domain objects into a single `ownerService` export.
 */
export * from './owner-ads.service';
export * from './owner-analytics.service';
export * from './owner-availability.service';
export * from './owner-financials.service';
export * from './owner-lease.service';
export * from './owner-reviews.service';
export * from './owner-sessions.service';
export * from './owner-screening.service';
export * from './owner-tenants.service';

// ── Legacy ownerService shim ──────────────────────────────────────────────────
// Spreads all domain methods so that callers using `ownerService.getMyAds()`
// continue to work without changes.
import { ownerAdsService } from './owner-ads.service';
import { ownerAnalyticsService } from './owner-analytics.service';
import { ownerAvailabilityService } from './owner-availability.service';
import { ownerFinancialsService } from './owner-financials.service';
import { ownerLeaseService } from './owner-lease.service';
import { ownerReviewsService } from './owner-reviews.service';
import { ownerSessionsService } from './owner-sessions.service';
import { ownerScreeningService } from './owner-screening.service';
import { ownerTenantsService } from './owner-tenants.service';

export const ownerService = {
  ...ownerAdsService,
  ...ownerAnalyticsService,
  ...ownerAvailabilityService,
  ...ownerFinancialsService,
  ...ownerLeaseService,
  ...ownerReviewsService,
  ...ownerSessionsService,
  ...ownerScreeningService,
  ...ownerTenantsService,
};
