/**
 * Owner tenants & team service — tenants, team members, notifications, login history.
 */
import api from '@/lib/api';
import type { PaginatedMeta } from './owner-financials.service';

export interface Tenant {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  notes: string | null;
  lease_contracts_count?: number;
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

export const ownerTenantsService = {
  // ── Tenants ──────────────────────────────────────────────

  async getTenants(
    params?: { page?: number; per_page?: number },
    request?: { signal?: AbortSignal }
  ): Promise<{ data: Tenant[]; meta: PaginatedMeta }> {
    const { data } = await api.get('/my/tenants', {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },

  async getTenant(
    id: string,
    request?: { signal?: AbortSignal }
  ): Promise<Tenant> {
    const { data } = await api.get<{ data: Tenant }>(
      `/my/tenants/${id}`,
      request?.signal ? { signal: request.signal } : {}
    );
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

  // ── Team ─────────────────────────────────────────────────

  async getTeam(request?: {
    signal?: AbortSignal;
  }): Promise<{ members: TeamMember[]; invitations: TeamInvitation[] }> {
    const { data } = await api.get('/my/team', {
      ...(request?.signal ? { signal: request.signal } : {}),
    });
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

  // ── Notification Preferences ──────────────────────────────

  async getNotificationPreferences(request?: {
    signal?: AbortSignal;
  }): Promise<NotificationPreferences> {
    const { data } = await api.get<{ data: NotificationPreferences }>(
      '/my/notification-preferences',
      request?.signal ? { signal: request.signal } : {}
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

  // ── Login History ─────────────────────────────────────────

  async getLoginHistory(
    page = 1,
    request?: { signal?: AbortSignal }
  ): Promise<{ data: LoginHistoryEntry[]; meta: PaginatedMeta }> {
    const { data } = await api.get('/my/login-history', {
      params: { page },
      ...(request?.signal ? { signal: request.signal } : {}),
    });
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
};
