export type TrendRow = { date: string; count: number };

export function periodParamToDays(period: string): number {
  if (period === '7d') {
    return 7;
  }
  if (period === '90d') {
    return 90;
  }
  return 30;
}

/**
 * Clé calendaire UTC (YYYY-MM-DD), alignée sur DATE(created_at) côté MySQL quand les timestamps
 * sont stockés en UTC — évite le décalage « favoris dans le KPI mais 0 sur le graphique »
 * (anciennement toISOString() après minuit local).
 */
function toUtcDateKeyFromMillis(utcMidnightMs: number): string {
  return new Date(utcMidnightMs).toISOString().slice(0, 10);
}

/** Libellé axe X pour une date UTC (cohérent avec fullDate). */
function formatUtcDayLabel(utcMidnightMs: number): string {
  return new Date(utcMidnightMs).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  });
}

function utcDayRangeEndingToday(days: number): number[] {
  const now = new Date();
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const keys: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(endUtc - i * 86_400_000);
  }
  return keys;
}

/**
 * Séries quotidiennes alignées sur N jours (0 si pas d’événement ce jour-là).
 * L’API renvoie trends.view / trends.favorite avec { date, count }.
 */
export function mergeViewsAndFavoritesSeries(
  trends: Record<string, TrendRow[]> | undefined,
  days: number,
): Array<{ label: string; fullDate: string; views: number; favorites: number }> {
  const views = trends?.view ?? [];
  const favorites = trends?.favorite ?? [];

  const byDate = new Map<string, { views: number; favorites: number }>();

  for (const p of views) {
    const cur = byDate.get(p.date) ?? { views: 0, favorites: 0 };
    cur.views += p.count ?? 0;
    byDate.set(p.date, cur);
  }
  for (const p of favorites) {
    const cur = byDate.get(p.date) ?? { views: 0, favorites: 0 };
    cur.favorites += p.count ?? 0;
    byDate.set(p.date, cur);
  }

  const out: Array<{ label: string; fullDate: string; views: number; favorites: number }> = [];
  for (const utcMs of utcDayRangeEndingToday(days)) {
    const key = toUtcDateKeyFromMillis(utcMs);
    const row = byDate.get(key) ?? { views: 0, favorites: 0 };
    const label = formatUtcDayLabel(utcMs);
    out.push({ label, fullDate: key, ...row });
  }

  return out;
}

/** Valeurs pour mini sparkline (une métrique). */
export function extractMetricSeries(
  trends: Record<string, TrendRow[]> | undefined,
  typeKey: string,
  days: number,
): number[] {
  const rows = trends?.[typeKey] ?? [];
  const map = new Map(rows.map((r) => [r.date, r.count]));
  const values: number[] = [];
  for (const utcMs of utcDayRangeEndingToday(days)) {
    values.push(map.get(toUtcDateKeyFromMillis(utcMs)) ?? 0);
  }
  return values;
}
