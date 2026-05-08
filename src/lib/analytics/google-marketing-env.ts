/**
 * Build-time configuration for GA4 / GTM (NEXT_PUBLIC_*).
 */

export function getGoogleMarketingIds(): {
  gaMeasurementId: string | undefined;
  gtmId: string | undefined;
} {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();

  return {
    gaMeasurementId:
      gaMeasurementId && gaMeasurementId.length > 0
        ? gaMeasurementId
        : undefined,
    gtmId: gtmId && gtmId.length > 0 ? gtmId : undefined,
  };
}

export function isGoogleMarketingConfigured(): boolean {
  const { gaMeasurementId, gtmId } = getGoogleMarketingIds();

  return Boolean(gaMeasurementId || gtmId);
}
