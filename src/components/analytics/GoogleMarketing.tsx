'use client';

import {
  COOKIE_CONSENT_EVENT,
  type CookieConsentPreferences,
  DEFAULT_COOKIE_CONSENT,
  loadCookieConsentPreferences,
} from '@/lib/cookie-consent-storage';
import { pushAttributionToDataLayer } from '@/lib/analytics/data-layer-utm';
import {
  hasAnalyticsConsent,
  pushGtagConsentUpdate,
} from '@/lib/analytics/gtag-consent';
import { getGoogleMarketingIds } from '@/lib/analytics/google-marketing-env';
import { getAttributionBodyForApi } from '@/lib/utm';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect } from 'react';

function GtagConsentBridge(): null {
  useEffect(() => {
    const sync = (prefs: CookieConsentPreferences) => {
      pushGtagConsentUpdate(prefs);
    };
    const stored = loadCookieConsentPreferences();
    if (stored) {
      sync(stored);
    } else {
      sync(DEFAULT_COOKIE_CONSENT);
    }
    const onConsent = (ev: Event) => {
      const ce = ev as CustomEvent<CookieConsentPreferences>;
      if (ce.detail) {
        sync(ce.detail);
      }
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent as EventListener);

    return () =>
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        onConsent as EventListener
      );
  }, []);

  return null;
}

function GaPageAndAttributionTrackerInner({
  gaMeasurementId,
  mode,
}: {
  gaMeasurementId?: string;
  mode: 'ga4' | 'gtm';
}): null {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const firePageView = useCallback(() => {
    const prefs = loadCookieConsentPreferences();
    if (!hasAnalyticsConsent(prefs)) {
      return;
    }
    const pagePath =
      pathname + (queryString.length > 0 ? `?${queryString}` : '');
    if (
      typeof window.gtag === 'function' &&
      mode === 'ga4' &&
      gaMeasurementId
    ) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pagePath,
      });
    }
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, queryString, mode, gaMeasurementId]);

  useEffect(() => {
    firePageView();
    const onConsent = () => {
      firePageView();
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);

    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, [firePageView]);

  return null;
}

function AttributionDataLayerInner(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const querySignature = searchParams.toString();

  useEffect(() => {
    pushAttributionToDataLayer(getAttributionBodyForApi());
  }, [pathname, querySignature]);

  return null;
}

function GaPageAndAttributionTracker({
  gaMeasurementId,
  mode,
}: {
  gaMeasurementId?: string;
  mode: 'ga4' | 'gtm';
}) {
  return (
    <Suspense fallback={null}>
      <GaPageAndAttributionTrackerInner
        gaMeasurementId={gaMeasurementId}
        mode={mode}
      />
      <AttributionDataLayerInner />
    </Suspense>
  );
}

export function GoogleMarketing({ nonce }: { nonce: string }) {
  const { gaMeasurementId, gtmId } = getGoogleMarketingIds();

  if (!gaMeasurementId && !gtmId) {
    return null;
  }

  if (gtmId) {
    if (gaMeasurementId && process.env.NODE_ENV === 'development') {
      console.warn(
        '[GoogleMarketing] NEXT_PUBLIC_GTM_ID is set; GA direct id is ignored to avoid duplicate hits. Configure GA4 inside GTM only.'
      );
    }

    const gtmSnippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;j.nonce=${JSON.stringify(nonce)};f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`;

    return (
      <>
        <GtagConsentBridge />
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: gtmSnippet }}
        />
        <noscript>
          <iframe
            title="Google Tag Manager"
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
            height={0}
            width={0}
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <GaPageAndAttributionTracker mode="gtm" />
      </>
    );
  }

  const gaId = gaMeasurementId as string;

  const onGtagLoad = () => {
    if (typeof window.gtag !== 'function') {
      return;
    }
    window.gtag('js', new Date());
    window.gtag('config', gaId, { send_page_view: false });
  };

  return (
    <>
      <GtagConsentBridge />
      <Script
        id="ga-gtag-js"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
        nonce={nonce}
        onLoad={onGtagLoad}
      />
      <GaPageAndAttributionTracker mode="ga4" gaMeasurementId={gaId} />
    </>
  );
}
