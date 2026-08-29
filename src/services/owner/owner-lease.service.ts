/**
 * Owner lease contract service — lease generation, updates, e-signature.
 */
import api from '@/lib/api';

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore non-JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (text === '') return undefined as T;
  return JSON.parse(text) as T;
}

export type LeaseStatus =
  | 'draft'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'archived';

export interface LeaseContract {
  id: string;
  ad_id: string;
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
  status: LeaseStatus;
  status_label: string;
  terminated_at: string | null;
  termination_reason: string | null;
  archived_at: string | null;
  created_at: string;
  ad?: { id: string; title: string };
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

export interface PublicSignatureSecurity {
  otp_required_for_sign_or_decline: boolean;
}

export type PublicSignatureShowResponse = {
  security?: PublicSignatureSecurity;
  request: SignatureRequest & { contract: LeaseContract };
};

export const ownerLeaseService = {
  async getLeaseContracts(
    params?: { page?: number; per_page?: number },
    request?: { signal?: AbortSignal }
  ) {
    const { data } = await api.get<{
      data: LeaseContract[];
      meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
      };
    }>('/my/lease-contracts', {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },

  async getLeaseContract(
    id: string,
    request?: { signal?: AbortSignal }
  ): Promise<LeaseContract> {
    const { data } = await api.get<{ data: LeaseContract }>(
      `/my/lease-contracts/${id}`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
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

  async enhanceLeaseConditions(conditions: string): Promise<string> {
    const { data } = await api.post<{ enhanced: string }>(
      '/my/lease-contracts/ai/enhance-conditions',
      { conditions }
    );
    return data.enhanced;
  },

  async summarizeLeaseContract(params: {
    monthly_rent?: number;
    deposit_amount?: number;
    start_date?: string;
    duration_months?: number;
    special_conditions?: string;
  }): Promise<string> {
    const { data } = await api.post<{ summary: string }>(
      '/my/lease-contracts/ai/summarize',
      params
    );
    return data.summary;
  },

  // ── E-Signature ──────────────────────────────────────────

  async getSignatureRequests(
    leaseContractId: string,
    request?: { signal?: AbortSignal }
  ): Promise<SignatureRequest[]> {
    const { data } = await api.get<{ data: SignatureRequest[] }>(
      `/my/lease-contracts/${leaseContractId}/signatures`,
      request?.signal ? { signal: request.signal } : {}
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

  async getPublicSignatureRequest(
    token: string
  ): Promise<PublicSignatureShowResponse> {
    return publicFetch<PublicSignatureShowResponse>(`/signatures/${token}`);
  },

  /**
   * Full contract, rendered server-side as HTML (not the stored PDF blob) so
   * it displays inside an `<iframe srcDoc>` on iOS Safari / WebKit, where a
   * `blob:` PDF shows blank. Public + token-scoped; returns the raw markup.
   */
  async getPublicSignatureContractPreviewHtml(token: string): Promise<string> {
    const res = await fetch(`${PUBLIC_API_URL}/signatures/${token}/preview`, {
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return res.text();
  },

  async sendSignatureOtp(token: string): Promise<{ message?: string }> {
    return publicFetch<{ message?: string }>(`/signatures/${token}/send-otp`, {
      method: 'POST',
    });
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
      body: JSON.stringify({ otp: payload.otp, reason: payload.reason }),
    });
  },

  // ── Lifecycle ────────────────────────────────────────────────

  async renewLeaseContract(
    leaseContractId: string,
    payload: { extend_months: number; monthly_rent?: number }
  ): Promise<LeaseContract> {
    const { data } = await api.post<{ data: LeaseContract }>(
      `/my/lease-contracts/${leaseContractId}/renew`,
      payload
    );
    return data.data ?? data;
  },

  async terminateLeaseContract(
    leaseContractId: string,
    payload: { reason: string }
  ): Promise<LeaseContract> {
    const { data } = await api.post<{ data: LeaseContract }>(
      `/my/lease-contracts/${leaseContractId}/terminate`,
      payload
    );
    return data.data ?? data;
  },

  async archiveLeaseContract(leaseContractId: string): Promise<LeaseContract> {
    const { data } = await api.post<{ data: LeaseContract }>(
      `/my/lease-contracts/${leaseContractId}/archive`
    );
    return data.data ?? data;
  },
};
