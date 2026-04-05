'use client';

import api from '@/lib/api';
import {
  getAttributionBodyForApi,
  hasPostedVisitThisBrowserSession,
  markVisitPosted,
  persistUtmFromCurrentUrl,
} from '@/lib/utm';
import { useEffect } from 'react';

/**
 * Runs once per browser tab session: stores UTM params from the URL and notifies
 * the API so admin analytics can attribute traffic.
 */
export function UtmCaptureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    persistUtmFromCurrentUrl();
    if (hasPostedVisitThisBrowserSession()) {
      return;
    }
    const body = getAttributionBodyForApi();
    if (!body.session_id) {
      return;
    }
    void api
      .post('/track/visit', body)
      .then(() => {
        markVisitPosted();
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
