/**
 * Owner ads service — ad list, boost, QR codes, printables, identity verification.
 */
import api from '@/lib/api';

export interface BoostStatus {
  is_boosted: boolean;
  boost_score: number | null;
  boost_expires_at: string | null;
  boosted_at: string | null;
}

export const ownerAdsService = {
  async getMyAds(
    params?: {
      page?: number;
      per_page?: number;
      q?: string;
      status?: string;
      type_id?: string;
      city_id?: string;
      quarter_id?: string;
      price_min?: number;
      price_max?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    },
    request?: { signal?: AbortSignal }
  ) {
    const { data } = await api.get('/my/ads', {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },

  async boostAd(adId: string, planId: string, callbackUrl?: string) {
    const { data } = await api.post(`/my/ads/${adId}/boost`, {
      plan_id: planId,
      callback_url: callbackUrl,
    });
    return data;
  },

  async getBoostStatus(
    adId: string,
    request?: { signal?: AbortSignal }
  ): Promise<BoostStatus> {
    const { data } = await api.get<{ data: BoostStatus }>(
      `/my/ads/${adId}/boost-status`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  async selfBoostAd(
    adId: string,
    durationDays?: number
  ): Promise<{ is_boosted: boolean; boost_expires_at: string | null }> {
    const { data } = await api.post(`/my/ads/${adId}/boost`, {
      duration_days: durationDays,
    });
    return data.data ?? data;
  },

  async unboostAd(adId: string): Promise<void> {
    await api.delete(`/my/ads/${adId}/boost`);
  },

  async duplicateAd(adId: string): Promise<{ id: string; slug: string }> {
    const { data } = await api.post<{ data: { id: string; slug: string } }>(
      `/my/ads/${adId}/duplicate`
    );
    return data.data ?? data;
  },

  async bulkUpdateAdStatus(
    ids: string[],
    status: string
  ): Promise<{ updated: number; failed: string[] }> {
    const { data } = await api.put('/my/ads/bulk-update', { ids, status });
    return data;
  },

  async bulkDeleteAds(ids: string[]): Promise<{ deleted: number }> {
    const { data } = await api.post('/my/ads/bulk-delete', { ids });
    return data;
  },

  async verifyIdentity(formData: FormData) {
    const { data } = await api.post('/my/verify-identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // ── QR & printables ──────────────────────────────────────

  async getAdQrCodeMeta(
    adId: string,
    config?: { signal?: AbortSignal }
  ): Promise<{
    ad_url: string;
    profile_url: string | null;
    qr_data_uri: string;
  }> {
    const { data } = await api.get<{
      data: { ad_url: string; profile_url: string | null; qr_data_uri: string };
    }>(`/my/ads/${adId}/qr-code`, config);
    return data.data;
  },

  async downloadAdQrPng(adId: string): Promise<Blob> {
    const { data } = await api.get(`/my/ads/${adId}/qr-code/image`, {
      responseType: 'blob',
    });
    return data;
  },

  async downloadAdPlacarde(adId: string): Promise<Blob> {
    const { data } = await api.get(`/my/ads/${adId}/placarde`, {
      responseType: 'blob',
    });
    return data;
  },

  async getProfileQrMeta(config?: {
    signal?: AbortSignal;
  }): Promise<{ profile_url: string; qr_data_uri: string }> {
    const { data } = await api.get<{
      data: { profile_url: string; qr_data_uri: string };
    }>('/my/profile/qr-code', config);
    return data.data;
  },

  async downloadProfileQrPng(): Promise<Blob> {
    const { data } = await api.get('/my/profile/qr-code/image', {
      responseType: 'blob',
    });
    return data;
  },

  async downloadBusinessCard(): Promise<Blob> {
    const { data } = await api.get('/my/profile/business-card', {
      responseType: 'blob',
    });
    return data;
  },

  async fetchBusinessCardPreviewHtml(config?: {
    signal?: AbortSignal;
  }): Promise<string> {
    const { data } = await api.get<string>(
      '/my/profile/business-card/preview',
      {
        responseType: 'text',
        headers: { Accept: 'text/html' },
        ...config,
      }
    );
    return data;
  },
};
