import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function tourProxyBackendOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  try {
    if (apiUrl) {
      return new URL(apiUrl).origin;
    }
  } catch {
    /* noop */
  }

  const override = process.env.TOUR_PROXY_BACKEND_ORIGIN?.trim();
  if (override) {
    try {
      return new URL(override).origin;
    } catch {
      return override.replace(/\/$/, '');
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000';
  }

  return '';
}

const FORWARD_RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'accept-ranges',
  'content-range',
  'last-modified',
  'access-control-allow-origin',
  'access-control-expose-headers',
] as const;

/**
 * Proxies /tour-image/* to Laravel with the browser's Authorization header.
 * next.config rewrites do not forward Bearer tokens, so unlocked clients could not load panoramas.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const origin = tourProxyBackendOrigin();
  if (!origin) {
    return new NextResponse('Tour proxy: set NEXT_PUBLIC_API_URL or TOUR_PROXY_BACKEND_ORIGIN', {
      status: 500,
    });
  }

  const target = `${origin}/tour-image/${segments.join('/')}`;

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  if (auth) {
    headers.set('authorization', auth);
  }
  const range = request.headers.get('range');
  if (range) {
    headers.set('range', range);
  }
  const accept = request.headers.get('accept');
  if (accept) {
    headers.set('accept', accept);
  }

  const upstream = await fetch(target, {
    headers,
    cache: 'no-store',
    redirect: 'manual',
  });

  const response = new NextResponse(upstream.body, { status: upstream.status });

  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      response.headers.set(name, value);
    }
  }

  return response;
}
