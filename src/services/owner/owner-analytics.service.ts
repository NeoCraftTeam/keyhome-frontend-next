/**
 * Owner analytics service — ad performance metrics.
 */
import api from '@/lib/api';

export interface OwnerAnalyticsOverview {
  period: string;
  totals: {
    impressions: number;
    views: number;
    favorites: number;
    shares: number;
    contact_clicks: number;
    phone_clicks: number;
    unlocks: number;
    conversion_rate: number;
    engagement_rate: number;
  };
  /** Keys = interaction types (`view`, `favorite`, …), values = time-series. */
  trends: Record<string, { date: string; count: number }[]>;
  top_ads: Array<{
    ad_id: string;
    title: string;
    status?: string;
    views: number;
    favorites: number;
    unlocks: number;
    conversion_rate?: number;
  }>;
}

export const ownerAnalyticsService = {
  async getAnalytics(
    period: '7d' | '30d' | '90d' = '30d',
    request?: { signal?: AbortSignal }
  ): Promise<OwnerAnalyticsOverview> {
    const { data } = await api.get<{ data: OwnerAnalyticsOverview }>(
      '/my/ads/analytics',
      {
        params: { period },
        ...(request?.signal ? { signal: request.signal } : {}),
      }
    );
    return data.data ?? data;
  },

  async getBoostPlans(request?: { signal?: AbortSignal }) {
    const { data } = await api.get('/my/boost-plans', {
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },

  async getRentEstimate(
    params: {
      city_id: string;
      type_id: string;
      surface: number;
      bedrooms?: number;
    },
    request?: { signal?: AbortSignal }
  ): Promise<{
    estimated_min: number;
    estimated_median: number;
    estimated_max: number;
    sample_count: number;
    type_scope_matched?: boolean;
    bedrooms_scope_matched?: boolean;
    error?: string;
  }> {
    const { data } = await api.get('/rent-estimate', {
      params,
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },
};
