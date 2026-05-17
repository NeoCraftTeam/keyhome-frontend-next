'use client';

import { useKeyHomeClarity } from '@/hooks/useClarity';

/**
 * Mount once under authenticated dashboards to send Clarity identify + tags.
 */
export default function KeyHomeClarityIdentity(): null {
  useKeyHomeClarity();
  return null;
}
