import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, type Locale } from './routing';

/**
 * next-intl server configuration.
 *
 * Today this returns the default locale unconditionally — single-locale
 * setup. When additional locales ship (see `routing.ts`), update this to
 * read the locale from the URL segment or an Accept-Language header.
 *
 * See: https://next-intl.dev/docs/getting-started/app-router
 */
export default getRequestConfig(async () => {
  const locale: Locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
