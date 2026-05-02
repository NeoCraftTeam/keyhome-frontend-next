import { describe, expect, it } from 'vitest';
import { buildConnectSrcParts } from '@/lib/csp-allowlist';

describe('buildConnectSrcParts', () => {
  it('includes Google / Firebase API patterns', () => {
    const parts = buildConnectSrcParts({
      clerkOrigins: [],
      apiOrigin: '',
      backendOrigin: '',
      isDev: false,
      reverbHost: '',
    });
    expect(parts).toContain('https://*.googleapis.com');
    expect(parts).toContain('wss://*.googleapis.com');
    expect(parts).toContain('https://www.gstatic.com');
  });

  it('includes dev Reverb ports when isDev', () => {
    const parts = buildConnectSrcParts({
      clerkOrigins: [],
      apiOrigin: '',
      backendOrigin: '',
      isDev: true,
      reverbHost: '',
    });
    expect(parts).toContain('ws://localhost:8080');
  });

  it('includes keyhome.cm and Sentry / Vercel insights hosts', () => {
    const parts = buildConnectSrcParts({
      clerkOrigins: [],
      apiOrigin: '',
      backendOrigin: '',
      isDev: false,
      reverbHost: '',
    });
    expect(parts).toContain('https://*.keyhome.cm');
    expect(parts).toContain('https://vitals.vercel-insights.com');
    expect(parts).toContain('https://*.sentry.io');
  });
});
