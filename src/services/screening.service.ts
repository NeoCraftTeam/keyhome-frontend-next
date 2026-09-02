/**
 * Public, token-gated tenant screening service.
 *
 * Used by the tenant-facing /screening/[token] page to view the request,
 * upload the requested documents, and submit the dossier. There is no
 * authentication here: the 64-char token in the URL is the capability.
 * The endpoints behind it are upload-only — they never return the tenant's
 * stored files — so surfacing the link is safe.
 */
import api from '@/lib/api';

export type PublicScreeningStatus =
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

export interface PublicScreeningDocument {
  id: string;
  document_type: ScreeningDocumentType;
  document_type_label: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface PublicScreening {
  tenant_name: string;
  status: PublicScreeningStatus;
  status_label: string;
  required_documents: ScreeningDocumentType[];
  landlord_notes: string | null;
  expires_at: string;
  documents: PublicScreeningDocument[];
}

export interface SubmitScreeningResult {
  status: PublicScreeningStatus;
  status_label: string;
  submitted_at: string;
}

export interface UploadScreeningPayload {
  document_type: ScreeningDocumentType;
  file: File;
  notes?: string;
}

export const screeningService = {
  async getPublicScreening(
    token: string,
    request?: { signal?: AbortSignal }
  ): Promise<PublicScreening> {
    const { data } = await api.get<{ data: PublicScreening }>(
      `/screening/${token}`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  async uploadDocument(
    token: string,
    payload: UploadScreeningPayload
  ): Promise<PublicScreeningDocument> {
    const formData = new FormData();
    formData.append('document_type', payload.document_type);
    formData.append('file', payload.file);
    if (payload.notes) {
      formData.append('notes', payload.notes);
    }
    const { data } = await api.post<{ data: PublicScreeningDocument }>(
      `/screening/${token}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data ?? data;
  },

  async submit(token: string): Promise<SubmitScreeningResult> {
    const { data } = await api.post<{ data: SubmitScreeningResult }>(
      `/screening/${token}/submit`
    );
    return data.data ?? data;
  },
};
