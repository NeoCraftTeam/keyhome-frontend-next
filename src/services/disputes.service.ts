import api from '@/lib/api';
import type {
  CreateDisputePayload,
  Dispute,
  DisputeEvidence,
  DisputeEvidenceType,
  DisputeMessage,
  DisputeStatus,
  PaginatedResponse,
} from '@/types';

export const disputesService = {
  async list(params?: {
    page?: number;
    status?: string;
    open_only?: boolean;
  }): Promise<PaginatedResponse<Dispute>> {
    const { data } = await api.get<PaginatedResponse<Dispute>>('/disputes', {
      params,
    });
    return data;
  },

  async get(id: string): Promise<Dispute> {
    const { data } = await api.get<{ data: Dispute }>(`/disputes/${id}`);
    return data.data;
  },

  async create(payload: CreateDisputePayload): Promise<Dispute> {
    const { data } = await api.post<{ data: Dispute }>('/disputes', payload);
    return data.data;
  },

  async sendMessage(disputeId: string, body: string): Promise<DisputeMessage> {
    const { data } = await api.post<{ data: DisputeMessage }>(
      `/disputes/${disputeId}/messages`,
      { body }
    );
    return data.data;
  },

  async uploadEvidence(
    disputeId: string,
    file: File,
    type: DisputeEvidenceType
  ): Promise<DisputeEvidence> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const { data } = await api.post<{ data: DisputeEvidence }>(
      `/disputes/${disputeId}/evidences`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  async transition(
    disputeId: string,
    status: DisputeStatus,
    resolutionNote?: string
  ): Promise<Dispute> {
    const { data } = await api.patch<{ data: Dispute }>(
      `/disputes/${disputeId}/status`,
      { status, resolution_note: resolutionNote }
    );
    return data.data;
  },
};
