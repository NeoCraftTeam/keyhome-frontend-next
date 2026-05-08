'use client';

import api from '@/lib/api';
import {
  getAttributionBodyForApi,
  persistUtmFromSearchParams,
} from '@/lib/utm';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

/**
 * Best-effort POST to Laravel: persists UTM from the active URL on every
 * navigation, then ingests {@code /api/v1/track/visit}. Duplicate payloads are
 * deduped for ~60s server-side; distinct {@code utm_content} creates distinct rows.
 */
function UtmCaptureEffects(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const querySignature = searchParams.toString();

  useEffect(() => {
    persistUtmFromSearchParams(new URLSearchParams(querySignature));
    const body = getAttributionBodyForApi();
    if (!body.session_id) {
      return;
    }
    void api.post('/track/visit', body).catch(() => {});
  }, [pathname, querySignature]);

  return null;
}

export function UtmCaptureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <UtmCaptureEffects />
      </Suspense>
      {children}
    </>
  );
}
