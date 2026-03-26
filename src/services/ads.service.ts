import api from '@/lib/api';
import {
  Ad,
  AutocompleteResult,
  FacetsResponse,
  NearbyParams,
  PaginatedResponse,
  SearchParams,
} from '@/types';

/**
 * Default Axios timeout is 30s; multipart ad payloads (many images,
 * server-side WebP conversions, Scout/Meilisearch) routinely exceed that.
 */
const MULTIPART_AD_TIMEOUT_MS = 120_000;

/**
 * Tour scenes: up to 30 MiB per image (API), multiple files — upload + disk/S3 + metadata
 * often exceeds 30s. Override in production if needed:
 * NEXT_PUBLIC_API_TOUR_UPLOAD_TIMEOUT_MS
 */
function resolveTourScenesUploadTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_API_TOUR_UPLOAD_TIMEOUT_MS;
  if (raw === undefined || raw === '') {
    return 600_000;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return 600_000;
  }
  return Math.max(30_000, Math.min(n, 1_800_000));
}

const TOUR_SCENES_UPLOAD_TIMEOUT_MS = resolveTourScenesUploadTimeoutMs();

export const adsService = {
  async list(params?: {
    page?: number;
    per_page?: number;
    order_by?: string;
    direction?: 'asc' | 'desc';
    type?: string;
    exclude_ids?: string[];
  }): Promise<PaginatedResponse<Ad>> {
    const { data } = await api.get('/ads', { params });
    return data;
  },

  async show(id: string): Promise<Ad> {
    const { data } = await api.get(`/ads/${id}`);
    return data.data ?? data;
  },

  async search(params: SearchParams): Promise<PaginatedResponse<Ad>> {
    const { data } = await api.get('/ads/search', { params });
    return data;
  },

  async nearby(params: NearbyParams): Promise<Ad[]> {
    const { data } = await api.get('/ads/nearby', { params });
    return data.data ?? data;
  },

  async nearbyForUser(userId: string, params: NearbyParams): Promise<Ad[]> {
    const { data } = await api.get(`/ads/${userId}/nearby`, { params });
    return data.data ?? data;
  },

  async autocomplete(
    field: 'city' | 'type' | 'quarter',
    q: string
  ): Promise<AutocompleteResult[]> {
    const { data } = await api.get('/ads/autocomplete', {
      params: { field, q },
    });
    return data.data ?? data;
  },

  async facets(): Promise<FacetsResponse> {
    const { data } = await api.get('/ads/facets');
    return data.data ?? data;
  },

  async create(formData: FormData): Promise<Ad> {
    const { data } = await api.post('/ads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: MULTIPART_AD_TIMEOUT_MS,
    });
    const body = data.data ?? data;
    return body.ad ?? body;
  },

  async update(id: string, formData: FormData): Promise<Ad> {
    // Laravel requires POST + _method for multipart/form-data uploads
    formData.append('_method', 'PUT');
    const { data } = await api.post(`/ads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: MULTIPART_AD_TIMEOUT_MS,
    });
    const body = data.data ?? data;
    return body.ad ?? body;
  },

  async destroy(id: string): Promise<void> {
    await api.delete(`/ads/${id}`);
  },

  async toggleVisibility(adId: string): Promise<{ is_visible: boolean }> {
    const { data } = await api.post<{
      data?: { is_visible: boolean };
      is_visible?: boolean;
    }>(`/ads/${adId}/toggle-visibility`);
    const visible = data.data?.is_visible ?? data.is_visible ?? true;
    return { is_visible: visible };
  },

  async enhanceDescription(description: string): Promise<{ enhanced: string }> {
    const { data } = await api.post<{ enhanced: string }>(
      '/ads/ai/enhance-description',
      {
        description,
      }
    );
    return data;
  },

  async setStatus(
    adId: string,
    status: string
  ): Promise<{ old_status: string; new_status: string }> {
    const { data } = await api.post<{
      old_status: string;
      new_status: string;
      data?: { old_status: string; new_status: string };
    }>(`/ads/${adId}/set-status`, { status });
    const d = data?.data ?? data;
    return {
      old_status: d?.old_status ?? status,
      new_status: d?.new_status ?? status,
    };
  },

  async getStats(): Promise<{
    ads_count: number;
    cities_count: number;
    users_count: number;
  }> {
    const { data } = await api.get('/stats/landing');
    return data;
  },

  /**
   * Record a view interaction — fire & forget, never throws.
   * Called once when a user opens an ad detail page.
   * Feeds the recommendation engine.
   */
  async recentlyViewed(): Promise<Ad[]> {
    const { data } = await api.get('/my/recently-viewed');
    return data.data ?? data;
  },

  trackView(id: string): void {
    api.post(`/ads/${id}/view`).catch(() => {
      // Silently ignore — non-critical telemetry
    });
  },

  // ── 3D Tour Management ──────────────────────────

  async getTour(adId: string): Promise<{
    has_tour: boolean;
    scenes_count: number;
    tour_published_at: string | null;
    config: Record<string, unknown>;
  }> {
    const { data } = await api.get(`/ads/${adId}/tour`);
    return data;
  },

  async uploadTourScenes(
    adId: string,
    scenes: {
      title: string;
      image: File;
      hotspots?: Array<{
        pitch: number;
        yaw: number;
        target_scene: string;
        label: string;
      }>;
    }[]
  ): Promise<{
    message: string;
    scenes_count: number;
    config: Record<string, unknown>;
  }> {
    const formData = new FormData();
    scenes.forEach((scene, i) => {
      formData.append(`scenes[${i}][title]`, scene.title);
      formData.append(`scenes[${i}][image]`, scene.image);
      if (scene.hotspots) {
        scene.hotspots.forEach((h, j) => {
          formData.append(
            `scenes[${i}][hotspots][${j}][pitch]`,
            String(h.pitch)
          );
          formData.append(`scenes[${i}][hotspots][${j}][yaw]`, String(h.yaw));
          formData.append(
            `scenes[${i}][hotspots][${j}][target_scene]`,
            h.target_scene
          );
          formData.append(`scenes[${i}][hotspots][${j}][label]`, h.label);
        });
      }
    });
    const { data } = await api.post(`/ads/${adId}/tour/scenes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: TOUR_SCENES_UPLOAD_TIMEOUT_MS,
    });
    return data;
  },

  async updateHotspots(
    adId: string,
    sceneId: string,
    hotspots: Array<{
      pitch: number;
      yaw: number;
      target_scene: string;
      label: string;
    }>
  ): Promise<{ message: string }> {
    const { data } = await api.patch(
      `/ads/${adId}/tour/scenes/${sceneId}/hotspots`,
      { hotspots }
    );
    return data;
  },

  async deleteTour(adId: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/ads/${adId}/tour`);
    return data;
  },
};
