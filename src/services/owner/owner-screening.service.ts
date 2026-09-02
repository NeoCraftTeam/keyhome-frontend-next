/**
 * Owner tenant screening service — create requests, review dossiers.
 */
import api from '@/lib/api';

export type ScreeningStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type ScreeningDocumentType =
  | 'id_card'
  | 'passport'
  | 'salary_slip'
  | 'employer_letter'
  | 'bank_statement'
  | 'tax_notice'
  | 'proof_of_address'
  | 'other';

export interface ScreeningDocument {
  id: string;
  document_type: ScreeningDocumentType;
  document_type_label: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  notes: string | null;
  url: string;
  created_at: string;
}

export interface ScreeningRequest {
  id: string;
  lease_contract_id: string;
  tenant_name: string;
  tenant_email: string;
  /**
   * Shareable public link (absolute URL) the owner can copy and send to the
   * tenant. The raw upload `token` is intentionally NOT exposed by the API —
   * see TenantScreeningRequestResource / TenantScreeningRequest::publicUrl().
   */
  screening_url: string;
  status: ScreeningStatus;
  status_label: string;
  required_documents: ScreeningDocumentType[];
  landlord_notes: string | null;
  review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  expires_at: string;
  documents: ScreeningDocument[];
  created_at: string;
}

export interface CreateScreeningPayload {
  tenant_name: string;
  tenant_email: string;
  required_documents: ScreeningDocumentType[];
  landlord_notes?: string;
  expires_in_days?: number;
}

export interface ReviewScreeningPayload {
  decision: 'approved' | 'rejected';
  review_notes?: string;
}

export const ownerScreeningService = {
  async getScreeningRequests(
    leaseContractId: string,
    request?: { signal?: AbortSignal }
  ): Promise<ScreeningRequest[]> {
    const { data } = await api.get<{ data: ScreeningRequest[] }>(
      `/my/lease-contracts/${leaseContractId}/screening`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  async createScreeningRequest(
    leaseContractId: string,
    payload: CreateScreeningPayload
  ): Promise<ScreeningRequest> {
    const { data } = await api.post<{ data: ScreeningRequest }>(
      `/my/lease-contracts/${leaseContractId}/screening`,
      payload
    );
    return data.data ?? data;
  },

  async getScreeningRequest(
    leaseContractId: string,
    screeningId: string,
    request?: { signal?: AbortSignal }
  ): Promise<ScreeningRequest> {
    const { data } = await api.get<{ data: ScreeningRequest }>(
      `/my/lease-contracts/${leaseContractId}/screening/${screeningId}`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  async reviewScreeningRequest(
    leaseContractId: string,
    screeningId: string,
    payload: ReviewScreeningPayload
  ): Promise<ScreeningRequest> {
    const { data } = await api.post<{ data: ScreeningRequest }>(
      `/my/lease-contracts/${leaseContractId}/screening/${screeningId}/review`,
      payload
    );
    return data.data ?? data;
  },
};
