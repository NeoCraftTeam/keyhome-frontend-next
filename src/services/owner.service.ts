/**
 * @deprecated
 * This file now delegates to domain-specific service files.
 * Import from '@/services/owner' for new code.
 *
 * Kept for backwards compatibility — all existing `import { ownerService } from '@/services/owner.service'`
 * callers continue to work unchanged.
 */
export * from './owner/index';
export { ownerService } from './owner/index';
