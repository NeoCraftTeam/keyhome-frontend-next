import api from '@/lib/api';

/**
 * Mirrors `App\Http\Resources\SubscriptionPlanResource`:
 * the API exposes both `price_monthly` and `price_yearly` (yearly may be null
 * when the plan only offers a monthly tier) along with formatted strings and
 * the yearly-savings amount.
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  price_monthly_formatted: string;
  price_yearly_formatted: string | null;
  yearly_savings: number | null;
  duration_days: number;
  boost_score: number | null;
  boost_duration_days: number | null;
  max_ads: number | null;
  is_unlimited: boolean;
  features: string[];
  sort_order: number;
}

export interface CurrentSubscription {
  id: string;
  plan: SubscriptionPlan;
  billing_period: 'monthly' | 'yearly';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  amount_paid: number;
  amount_paid_formatted: string;
  starts_at: string | null;
  ends_at: string | null;
  days_remaining: number;
  is_active: boolean;
  auto_renew: boolean;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface SubscriptionStats {
  has_active_subscription: boolean;
  current_plan: string | null;
  days_remaining: number | null;
  expires_at: string | null;
  total_boosted_ads: number;
}

export interface CurrentSubscriptionResponse {
  has_subscription: boolean;
  subscription: CurrentSubscription | null;
  stats: SubscriptionStats | null;
}

export interface SubscriptionInitiateResponse {
  payment_url: string;
  message: string;
}

export const subscriptionsService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await api.get<
      { data?: SubscriptionPlan[] } | SubscriptionPlan[]
    >('/subscriptions/plans');
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
  },

  async getCurrent(): Promise<CurrentSubscriptionResponse> {
    const { data } = await api.get<CurrentSubscriptionResponse>(
      '/subscriptions/current'
    );
    return {
      has_subscription: Boolean(data?.has_subscription),
      subscription: data?.subscription ?? null,
      stats: data?.stats ?? null,
    };
  },

  async getHistory(page = 1): Promise<{
    data: CurrentSubscription[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const { data } = await api.get('/subscriptions/history', {
      params: { page },
    });
    return data;
  },

  async subscribe(
    planId: string,
    billingPeriod: 'monthly' | 'yearly',
    callbackUrl?: string
  ): Promise<SubscriptionInitiateResponse> {
    const { data } = await api.post<SubscriptionInitiateResponse>(
      '/subscriptions/subscribe',
      {
        plan_id: planId,
        billing_period: billingPeriod,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      }
    );
    return data;
  },

  async cancel(reason?: string): Promise<void> {
    await api.post('/subscriptions/cancel', reason ? { reason } : {});
  },

  async toggleAutoRenew(enabled: boolean): Promise<void> {
    await api.patch('/subscriptions/auto-renew', { auto_renew: enabled });
  },
};
