import api from '@/lib/api';

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface AvailabilityPeriod {
  id?: string;
  starts_at: string;
  ends_at: string;
}

export interface AvailabilitySchedule {
  id: string;
  name: string;
  type: string;
  is_recurring: boolean;
  frequency: string | null;
  frequency_config: Record<string, unknown> | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  slot_duration: number;
  buffer_minutes: number;
  periods: AvailabilityPeriod[];
  created_at: string;
  updated_at: string;
}

export interface AvailabilityPayload {
  name: string;
  starts_on: string;
  ends_on?: string | null;
  periods: { starts_at: string; ends_at: string }[];
  recurrence?: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_days?: string[];
  days_of_month?: number[];
  slot_duration?: number;
  buffer_minutes?: number;
}

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
  /** Clés = types d’interaction API (`view`, `favorite`, …), points = { date, count } */
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

export interface LeaseContract {
  id: string;
  contract_number: string;
  unit_reference: string | null;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string | null;
  tenant_id_number: string | null;
  lease_start: string;
  lease_end: string;
  lease_duration_months: number;
  monthly_rent: number;
  deposit_amount: number | null;
  special_conditions: string | null;
  created_at: string;
  ad?: { id: string; title: string };
}

export interface OwnerReview {
  id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  owner_response: string | null;
  owner_responded_at: string | null;
  created_at: string;
  ad?: { id: string; title: string };
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    display_name: string;
  };
}

export interface OwnerViewingReservation {
  id: string;
  status: string;
  status_label: string;
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
  client_message: string | null;
  landlord_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  expires_at: string | null;
  client?: {
    firstname: string;
    lastname: string;
    phone_number?: string;
    email?: string;
  };
  ad?: { id: string; title: string };
  created_at: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  notes: string | null;
  lease_contracts_count?: number;
  lease_contracts?: LeaseContract[];
  created_at: string;
  updated_at: string;
}

export interface TenantPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  id_number?: string | null;
  notes?: string | null;
}

export interface Expense {
  id: string;
  ad_id: string;
  amount: number;
  category:
    | 'maintenance'
    | 'tax'
    | 'insurance'
    | 'utilities'
    | 'renovation'
    | 'other';
  description: string | null;
  expense_date: string;
  receipt_path: string | null;
  created_at: string;
}

export interface ExpensePayload {
  amount: number;
  category: Expense['category'];
  description?: string | null;
  expense_date: string;
}

export interface ProfitLoss {
  total_expenses: number;
  contract_revenue: number;
  net_income: number;
  expenses_by_category: Record<string, number>;
}

export interface OwnerDocument {
  id: string;
  ad_id: string;
  type: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface BoostStatus {
  is_boosted: boolean;
  boost_score: number | null;
  boost_expires_at: string | null;
  boosted_at: string | null;
}

export interface BoostPlan {
  id: string;
  name: string;
  price: number;
  boost_score: number;
  boost_duration_days: number;
  description: string | null;
}

export interface NotificationPreferences {
  id?: string;
  new_viewing_request: boolean;
  viewing_confirmed: boolean;
  new_review: boolean;
  payment_received: boolean;
  ad_expired: boolean;
  lease_expiring: boolean;
  new_message: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface LoginHistoryEntry {
  id: string;
  ip_address: string;
  device_type: string | null;
  browser: string | null;
  platform: string | null;
  country: string | null;
  city: string | null;
  guard: string;
  successful: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'manager' | 'viewer';
  token: string;
  expires_at: string;
}

export interface SignatureRequest {
  id: string;
  signer_email: string;
  signer_name: string;
  status: string;
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export const ownerService = {
  async getAnalytics(
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<OwnerAnalyticsOverview> {
    const { data } = await api.get<{ data: OwnerAnalyticsOverview }>(
      '/my/ads/analytics',
      {
        params: { period },
      }
    );
    return data.data ?? data;
  },

  async getMyAds(params?: {
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
  }) {
    const { data } = await api.get('/my/ads', { params });
    return data;
  },

  async getLeaseContracts(params?: { page?: number; per_page?: number }) {
    const { data } = await api.get<{
      data: LeaseContract[];
      meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
      };
    }>('/my/lease-contracts', { params });
    return data;
  },

  async enhanceLeaseConditions(conditions: string): Promise<string> {
    const { data } = await api.post<{ enhanced: string }>(
      '/my/lease-contracts/ai/enhance-conditions',
      {
        conditions,
      }
    );
    return data.enhanced;
  },

  async getLeaseContract(id: string): Promise<LeaseContract> {
    const { data } = await api.get<{ data: LeaseContract }>(
      `/my/lease-contracts/${id}`
    );
    return data.data ?? data;
  },

  async updateLeaseContract(
    id: string,
    updates: {
      tenant_name?: string;
      tenant_phone?: string;
      tenant_email?: string | null;
      tenant_id_number?: string | null;
      unit_reference?: string | null;
      special_conditions?: string | null;
    }
  ): Promise<LeaseContract> {
    const { data } = await api.put<{ data: LeaseContract }>(
      `/my/lease-contracts/${id}`,
      updates
    );
    return data.data ?? data;
  },

  async downloadLeaseContract(id: string): Promise<Blob> {
    const { data } = await api.get(`/my/lease-contracts/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async generateLeaseContract(
    adId: string,
    tenantData: {
      tenant_name: string;
      tenant_phone: string;
      tenant_email?: string;
      tenant_id_number?: string;
      unit_reference?: string;
      lease_start: string;
      lease_duration_months: number;
      monthly_rent?: number;
      deposit_amount?: number;
      special_conditions?: string;
    }
  ) {
    const { data } = await api.post(
      `/my/lease-contracts/${adId}/generate`,
      tenantData
    );
    return data;
  },

  async getMyReviews(params?: { page?: number; per_page?: number }) {
    const { data } = await api.get('/my/reviews', { params });
    return data;
  },

  /**
   * Owner reply to a single received review.
   * Backend allows only one reply per review (`POST /reviews/{id}/respond` returns 422 if already replied).
   */
  async respondToReview(
    reviewId: string,
    response: string
  ): Promise<{ data: OwnerReview; message: string }> {
    const { data } = await api.post(`/reviews/${reviewId}/respond`, {
      response,
    });
    return data;
  },

  async getViewingReservations(params?: { page?: number; status?: string }) {
    const { data } = await api.get<{
      data: OwnerViewingReservation[];
      meta: { current_page: number; last_page: number; total: number };
    }>('/my/viewing-reservations', { params });
    return data;
  },

  async confirmReservation(reservationId: string) {
    const { data } = await api.post(`/reservations/${reservationId}/confirm`);
    return data;
  },

  async cancelReservation(reservationId: string, cancellationReason?: string) {
    const { data } = await api.delete(`/reservations/${reservationId}`, {
      data: { cancellation_reason: cancellationReason },
    });
    return data;
  },

  async updateReservationNotes(reservationId: string, landlordNotes: string) {
    const { data } = await api.patch(`/reservations/${reservationId}/notes`, {
      landlord_notes: landlordNotes,
    });
    return data;
  },

  /**
   * Initiate a boost purchase for an ad.
   */
  async boostAd(adId: string, planId: string, callbackUrl?: string) {
    const { data } = await api.post(`/my/ads/${adId}/boost`, {
      plan_id: planId,
      callback_url: callbackUrl,
    });
    return data;
  },

  /**
   * Initiate identity verification for the owner.
   */
  async verifyIdentity(formData: FormData) {
    const { data } = await api.post('/my/verify-identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Get available boost plans for owners.
   */
  async getBoostPlans() {
    const { data } = await api.get('/my/boost-plans');
    return data;
  },

  // ─── Viewing Availability (Zap) ───

  async getAvailabilities(adId: string) {
    const { data } = await api.get<{ data: AvailabilitySchedule[] }>(
      `/ads/${adId}/availability`
    );
    return data.data ?? data;
  },

  async createAvailability(adId: string, payload: AvailabilityPayload) {
    const { data } = await api.post(`/ads/${adId}/availability`, payload);
    return data;
  },

  async updateAvailability(
    adId: string,
    scheduleId: string,
    payload: Partial<AvailabilityPayload>
  ) {
    const { data } = await api.put(
      `/ads/${adId}/availability/${scheduleId}`,
      payload
    );
    return data;
  },

  async deleteAvailability(adId: string, scheduleId: string) {
    const { data } = await api.delete(
      `/ads/${adId}/availability/${scheduleId}`
    );
    return data;
  },

  async getAvailabilityCalendar(adId: string, from: string, to: string) {
    const { data } = await api.get(`/ads/${adId}/availability/calendar`, {
      params: { from, to },
    });
    return data.data ?? data;
  },

  // ─── Boost (owner self-service) ───

  async getBoostStatus(adId: string): Promise<BoostStatus> {
    const { data } = await api.get<{ data: BoostStatus }>(
      `/my/ads/${adId}/boost-status`
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

  // ─── Tenants ───

  async getTenants(params?: {
    page?: number;
    per_page?: number;
  }): Promise<{ data: Tenant[]; meta: PaginatedMeta }> {
    const { data } = await api.get('/my/tenants', { params });
    return data;
  },

  async getTenant(id: string): Promise<Tenant> {
    const { data } = await api.get<{ data: Tenant }>(`/my/tenants/${id}`);
    return data.data ?? data;
  },

  async createTenant(payload: TenantPayload): Promise<Tenant> {
    const { data } = await api.post<{ data: Tenant }>('/my/tenants', payload);
    return data.data ?? data;
  },

  async updateTenant(
    id: string,
    payload: Partial<TenantPayload>
  ): Promise<Tenant> {
    const { data } = await api.put<{ data: Tenant }>(
      `/my/tenants/${id}`,
      payload
    );
    return data.data ?? data;
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/my/tenants/${id}`);
  },

  // ─── Expenses & Profit / Loss ───

  async getExpenses(
    adId: string,
    params?: { page?: number }
  ): Promise<{ data: Expense[]; meta: PaginatedMeta }> {
    const { data } = await api.get(`/my/ads/${adId}/expenses`, { params });
    return data;
  },

  async createExpense(adId: string, payload: ExpensePayload): Promise<Expense> {
    const { data } = await api.post<{ data: Expense }>(
      `/my/ads/${adId}/expenses`,
      payload
    );
    return data.data ?? data;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    await api.delete(`/my/expenses/${expenseId}`);
  },

  async getProfitLoss(adId: string): Promise<ProfitLoss> {
    const { data } = await api.get<{ data: ProfitLoss }>(
      `/my/ads/${adId}/profit-loss`
    );
    return data.data ?? data;
  },

  // ─── Documents ───

  async getDocuments(
    adId: string,
    type?: string
  ): Promise<{ data: OwnerDocument[] }> {
    const { data } = await api.get(`/my/ads/${adId}/documents`, {
      params: type ? { type } : undefined,
    });
    return data;
  },

  async uploadDocument(
    adId: string,
    file: File,
    type: string
  ): Promise<OwnerDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const { data } = await api.post<{ data: OwnerDocument }>(
      `/my/ads/${adId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data.data ?? data;
  },

  async downloadDocument(documentId: string): Promise<Blob> {
    const { data } = await api.get(`/my/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/my/documents/${documentId}`);
  },

  // ─── Notification Preferences ───

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const { data } = await api.get<{ data: NotificationPreferences }>(
      '/my/notification-preferences'
    );
    return data.data ?? data;
  },

  async updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data } = await api.put<{ data: NotificationPreferences }>(
      '/my/notification-preferences',
      prefs
    );
    return data.data ?? data;
  },

  // ─── Login History ───

  async getLoginHistory(
    page = 1
  ): Promise<PaginatedResponse<LoginHistoryEntry>> {
    const { data } = await api.get('/my/login-history', { params: { page } });
    // Backend wraps a Laravel paginator under 'data': { data: [...], current_page, ... }
    const paginator = data?.data ?? data;
    return {
      data: Array.isArray(paginator?.data)
        ? paginator.data
        : Array.isArray(paginator)
          ? paginator
          : [],
      meta: {
        current_page: paginator?.current_page ?? 1,
        last_page: paginator?.last_page ?? 1,
        per_page: paginator?.per_page ?? 20,
        total: paginator?.total ?? 0,
      },
    };
  },

  async clearLoginHistory(): Promise<void> {
    await api.delete('/my/login-history');
  },

  // ─── Team ───

  async getTeam(): Promise<{
    members: TeamMember[];
    invitations: TeamInvitation[];
  }> {
    const { data } = await api.get('/my/team');
    return data.data ?? data;
  },

  async inviteTeamMember(payload: {
    email: string;
    role: 'manager' | 'viewer';
  }): Promise<TeamInvitation> {
    const { data } = await api.post<{ data: TeamInvitation }>(
      '/my/team/invite',
      payload
    );
    return data.data ?? data;
  },

  async acceptTeamInvitation(token: string): Promise<void> {
    await api.post(`/my/team/invitations/${token}/accept`);
  },

  async revokeTeamInvitation(invitationId: string): Promise<void> {
    await api.delete(`/my/team/invitations/${invitationId}`);
  },

  async removeTeamMember(userId: string): Promise<void> {
    await api.delete(`/my/team/members/${userId}`);
  },

  // ─── E-Signature ───

  async getSignatureRequests(
    leaseContractId: string
  ): Promise<SignatureRequest[]> {
    const { data } = await api.get<{ data: SignatureRequest[] }>(
      `/my/lease-contracts/${leaseContractId}/signatures`
    );
    return data.data ?? data;
  },

  async createSignatureRequest(
    leaseContractId: string,
    payload: { signer_email: string; signer_name: string }
  ): Promise<SignatureRequest> {
    const { data } = await api.post<{ data: SignatureRequest }>(
      `/my/lease-contracts/${leaseContractId}/signatures`,
      payload
    );
    return data.data ?? data;
  },

  async getPublicSignatureRequest(token: string): Promise<{
    request: SignatureRequest & { contract: LeaseContract };
    security?: { otp_required_for_sign_or_decline: boolean };
  }> {
    return publicFetch(`/signatures/${token}`);
  },

  async sendSignatureOtp(token: string): Promise<void> {
    await publicFetch(`/signatures/${token}/send-otp`, { method: 'POST' });
  },

  async signSignatureRequest(token: string, otp: string): Promise<void> {
    await publicFetch(`/signatures/${token}/sign`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  },

  async declineSignatureRequest(
    token: string,
    payload: { otp: string; reason?: string }
  ): Promise<void> {
    await publicFetch(`/signatures/${token}/decline`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getRentEstimate(params: {
    city_id: string;
    type_id: string;
    surface: number;
    bedrooms?: number;
  }): Promise<{
    estimated_min: number;
    estimated_median: number;
    estimated_max: number;
    sample_count: number;
    type_scope_matched?: boolean;
    bedrooms_scope_matched?: boolean;
    error?: string;
  }> {
    const { data } = await api.get('/rent-estimate', { params });
    return data;
  },

  // ─── QR & printables (owner marketing) ───

  async getAdQrCodeMeta(adId: string): Promise<{
    ad_url: string;
    profile_url: string | null;
    qr_data_uri: string;
  }> {
    const { data } = await api.get<{
      data: {
        ad_url: string;
        profile_url: string | null;
        qr_data_uri: string;
      };
    }>(`/my/ads/${adId}/qr-code`);
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

  async getProfileQrMeta(): Promise<{
    profile_url: string;
    qr_data_uri: string;
  }> {
    const { data } = await api.get<{
      data: { profile_url: string; qr_data_uri: string };
    }>('/my/profile/qr-code');
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

  /**
   * Fetch a self-contained HTML preview of the business card. Same template
   * as the printable PDF — used as iframe `srcDoc` so the in-app preview is
   * a faithful 1:1 representation of what the user will download.
   */
  async fetchBusinessCardPreviewHtml(): Promise<string> {
    const { data } = await api.get<string>(
      '/my/profile/business-card/preview',
      {
        responseType: 'text',
        headers: { Accept: 'text/html' },
      }
    );
    return data;
  },
};
