/**
 * Build-time configuration for GA4 / GTM (NEXT_PUBLIC_*).
 */

const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

/**
 * Validates GTM container id so it can be safely embedded in inline script / iframe URL.
 */
export function sanitizeGtmContainerId(
  raw: string | undefined
): string | undefined {
  const id = raw?.trim();
  if (!id || !GTM_CONTAINER_ID_PATTERN.test(id)) {
    return undefined;
  }

  return id;
}

export function getGoogleMarketingIds(): {
  gaMeasurementId: string | undefined;
  gtmId: string | undefined;
} {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gtmId = sanitizeGtmContainerId(process.env.NEXT_PUBLIC_GTM_ID);

  return {
    gaMeasurementId:
      gaMeasurementId && gaMeasurementId.length > 0
        ? gaMeasurementId
        : undefined,
    gtmId,
  };
}

export function isGoogleMarketingConfigured(): boolean {
  const { gaMeasurementId, gtmId } = getGoogleMarketingIds();

  return Boolean(gaMeasurementId || gtmId);
}
