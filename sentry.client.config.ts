import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Filter out known noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    // Clerk auth errors that are expected in normal flow
    'clerk',
  ],
});
