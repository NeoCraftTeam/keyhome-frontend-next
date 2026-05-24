import api from '@/lib/api';
import {
  Ad,
  AutocompleteResult,
  CursorPaginatedResponse,
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
    status?: string;
    exclude_ids?: string[];
  }): Promise<PaginatedResponse<Ad>> {
    const { data } = await api.get('/ads', { params });
    return data;
  },

  /**
   * Cursor-paginated public feed (`GET /ads/feed`) for infinite scroll
   * (home page — no total count).
   */
  async feed(params?: {
    cursor?: string | null;
    per_page?: number;
    type?: string;
    exclude_ids?: string[];
  }): Promise<CursorPaginatedResponse<Ad>> {
    const { data } = await api.get<CursorPaginatedResponse<Ad>>('/ads/feed', {
      params: {
        ...params,
        cursor: params?.cursor ?? undefined,
      },
    });
    return data;
  },

  async show(id: string, config?: { signal?: AbortSignal }): Promise<Ad> {
    const options =
      config?.signal !== undefined ? { signal: config.signal } : undefined;
    const { data } = await api.get(`/ads/${id}`, options);
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

  /** Create or update a server-side draft (is_draft=1 flag). */
  async saveDraft(formData: FormData): Promise<Ad> {
    formData.append('is_draft', '1');
    const { data } = await api.post('/ads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: MULTIPART_AD_TIMEOUT_MS,
    });
    const body = data.data ?? data;
    return body.ad ?? body;
  },

  /** Update an existing draft on the server. */
  async updateDraft(id: string, formData: FormData): Promise<Ad> {
    formData.append('_method', 'PUT');
    formData.append('is_draft', '1');
    const { data } = await api.post(`/ads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: MULTIPART_AD_TIMEOUT_MS,
    });
    const body = data.data ?? data;
    return body.ad ?? body;
  },

  /**
   * Lightweight JSON-only autosave for text fields of a draft ad.
   *
   * Accepts arrays for fields like `attributes` (sent as-is in JSON body — no
   * FormData transformation). The backend mirrors validation in
   * `AdStatusController::autosave()`. Returns silently on success; consumers
   * surface errors via the calling hook (`useServerAutoSave.lastError`).
   */
  async autosaveDraft(
    id: string,
    fields: Partial<Record<string, string | number | boolean | string[] | null>>
  ): Promise<void> {
    await api.patch(`/ads/${id}/autosave`, fields);
  },

  /**
   * Save (merge) form fields into the server-side pending-edit draft_payload
   * of an existing live ad without touching its published fields.
   */
  async saveEditDraft(
    id: string,
    fields: Partial<Record<string, string | number | boolean | string[] | null>>
  ): Promise<{ draft_payload: Record<string, unknown> }> {
    const { data } = await api.patch<{
      data?: { draft_payload: Record<string, unknown> };
    }>(`/ads/${id}/edit-draft`, fields);
    return data?.data ?? { draft_payload: {} };
  },

  /**
   * Promote draft_payload to the live ad record.
   * Returns the freshly-updated ad.
   */
  async applyEditDraft(id: string): Promise<Ad> {
    const { data } = await api.post(`/ads/${id}/edit-draft/apply`);
    const body = data?.data ?? data;
    return body?.ad ?? body;
  },

  /** Discard the pending edit draft without modifying the live ad. */
  async discardEditDraft(id: string): Promise<void> {
    await api.delete(`/ads/${id}/edit-draft`);
  },

  /** Publish a draft ad (DRAFT → PENDING for admin review). */
  async publishDraft(
    adId: string
  ): Promise<{ old_status: string; new_status: string }> {
    const { data } = await api.post<{
      data?: { old_status: string; new_status: string };
      old_status?: string;
      new_status?: string;
    }>(`/ads/${adId}/publish`);
    const d = data?.data ?? data;
    return {
      old_status: d?.old_status ?? 'draft',
      new_status: d?.new_status ?? 'pending',
    };
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

  /**
   * Boost the given ad. Requires the owner to belong to an agency with an
   * active subscription (handled server-side in `BoostController::boost`).
   * The boost score and duration come from the active plan, not the client.
   */
  async boost(adId: string): Promise<{
    is_boosted: boolean;
    boost_expires_at: string | null;
  }> {
    const { data } = await api.post<{
      message?: string;
      data?: { is_boosted: boolean; boost_expires_at: string | null };
    }>(`/my/ads/${adId}/boost`);
    return data?.data ?? { is_boosted: false, boost_expires_at: null };
  },

  async unboost(adId: string): Promise<void> {
    await api.delete(`/my/ads/${adId}/boost`);
  },

  async getBoostStatus(adId: string): Promise<{
    is_boosted: boolean;
    boost_score: number | null;
    boost_expires_at: string | null;
    boosted_at: string | null;
  }> {
    const { data } = await api.get<{
      data: {
        is_boosted: boolean;
        boost_score: number | null;
        boost_expires_at: string | null;
        boosted_at: string | null;
      };
    }>(`/my/ads/${adId}/boost-status`);
    return data.data;
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
      { description }
    );
    return data;
  },

  async generateDescriptionFromAttributes(attributes: {
    type?: string;
    city?: string;
    quarter?: string;
    bedrooms?: number;
    surface?: number;
    price?: number;
    transaction_type?: string;
    notes?: string;
  }): Promise<{ generated: string }> {
    const { data } = await api.post<{ generated: string }>(
      '/ads/ai/generate-from-attributes',
      attributes
    );
    return data;
  },

  async enhanceTitle(
    title: string,
    context?: { type?: string; city?: string; transaction_type?: string }
  ): Promise<{ enhanced: string }> {
    const { data } = await api.post<{ enhanced: string }>(
      '/ads/ai/enhance-title',
      { title, ...context }
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
      /** Client-side temporary ID — sent so the backend can remap target_scene refs */
      clientId?: string;
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
      if (scene.clientId) {
        formData.append(`scenes[${i}][client_id]`, scene.clientId);
      }
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

  async getNeighborhoodScorecard(
    adId: string,
    force = false
  ): Promise<{
    data: {
      global_score: number;
      status: 'ok' | 'degraded' | 'unavailable';
      cached: boolean;
      computed_at: string | null;
      ors_used?: boolean;
      categories: Record<
        string,
        {
          score: number;
          poi_count: number;
          label: string;
          radius_m: number;
          nearest_poi: {
            osm_id: string;
            name: string | null;
            distance_m: number;
            mode: 'walking' | 'air';
          } | null;
        }
      >;
    };
  }> {
    const { data } = await api.get(`/ads/${adId}/neighborhood-scorecard`, {
      params: force ? { force: 1 } : {},
    });
    return data;
  },
};
