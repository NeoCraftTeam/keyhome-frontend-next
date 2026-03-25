import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl server configuration — single-locale (fr) foundation.
 *
 * This file is referenced by the `createNextIntlPlugin` call in next.config.ts.
 * It runs on the server for every request that needs translations.
 *
 * When multi-locale support is needed in the future, update this file to:
 *   1. Read the locale from the URL (e.g. /en/..., /fr/...) via `routing.ts`
 *   2. Dynamically import the matching messages file
 *   3. Add the locale prefix routing in `src/i18n/routing.ts`
 *
 * See: https://next-intl.dev/docs/getting-started/app-router
 */
export default getRequestConfig(async () => {
  const locale = 'fr';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
