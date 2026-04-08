import api from '@/lib/api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number | null;
  period: 'monthly' | 'yearly';
  features?: string[];
}

export interface CurrentSubscription {
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_end?: string;
}

export const subscriptionsService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await api.get<
      { data?: SubscriptionPlan[] } | SubscriptionPlan[]
    >('/subscriptions/plans');
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
  },

  async getCurrent(): Promise<CurrentSubscription | null> {
    const { data } = await api.get<{ data?: CurrentSubscription }>(
      '/subscriptions/current'
    );
    return data?.data ?? null;
  },

  async getHistory(page = 1) {
    const { data } = await api.get('/subscriptions/history', {
      params: { page },
    });
    return data;
  },
};
