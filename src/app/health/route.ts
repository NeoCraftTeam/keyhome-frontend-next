import { NextResponse } from 'next/server';

const BACKEND_HEALTH_URL = `${
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ??
  'http://localhost:8000'
}/api/health`;

const HEALTH_TOKEN = process.env.HEALTH_CHECK_TOKEN;

type CheckStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface CheckResult {
  status: CheckStatus;
  latency_ms: number | null;
  message: string;
}

async function checkBackend(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (HEALTH_TOKEN) headers['Authorization'] = `Bearer ${HEALTH_TOKEN}`;

    const res = await fetch(BACKEND_HEALTH_URL, {
      headers,
      signal: AbortSignal.timeout(6_000),
      // Server-side fetch — no withCredentials needed
      cache: 'no-store',
    });

    const latency_ms = Date.now() - start;

    if (res.status === 503) {
      return {
        status: 'degraded',
        latency_ms,
        message: 'Backend reports degraded/unhealthy',
      };
    }
    if (!res.ok) {
      return { status: 'degraded', latency_ms, message: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as { status?: string };
    const backendStatus =
      body.status === 'unhealthy'
        ? 'unhealthy'
        : body.status === 'degraded'
          ? 'degraded'
          : 'healthy';

    return {
      status: backendStatus,
      latency_ms,
      message: `Backend: ${body.status ?? 'ok'}`,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unreachable',
    };
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();

  const [backend] = await Promise.all([checkBackend()]);

  const process_check: CheckResult = {
    status: 'healthy',
    latency_ms: null,
    message: `Next.js running — uptime ${Math.floor(process.uptime())}s`,
  };

  const checks = { process: process_check, backend };

  const overall: CheckStatus =
    checks.backend.status === 'unhealthy'
      ? 'unhealthy'
      : checks.backend.status === 'degraded'
        ? 'degraded'
        : 'healthy';

  return NextResponse.json(
    {
      status: overall,
      timestamp,
      uptime_seconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
      checks,
    },
    { status: overall === 'unhealthy' ? 503 : 200 }
  );
}
