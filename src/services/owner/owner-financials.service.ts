/**
 * Owner financials service — expenses, profit/loss, documents.
 */
import api from '@/lib/api';

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

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const ownerFinancialsService = {
  async getExpenses(
    adId: string,
    params?: { page?: number },
    request?: { signal?: AbortSignal }
  ): Promise<{ data: Expense[]; meta: PaginatedMeta }> {
    const { data } = await api.get(`/my/ads/${adId}/expenses`, {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
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

  async getProfitLoss(
    adId: string,
    request?: { signal?: AbortSignal }
  ): Promise<ProfitLoss> {
    const { data } = await api.get<{ data: ProfitLoss }>(
      `/my/ads/${adId}/profit-loss`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  // ── Documents ────────────────────────────────────────────

  async getDocuments(
    adId: string,
    type?: string,
    request?: { signal?: AbortSignal }
  ): Promise<{ data: OwnerDocument[] }> {
    const { data } = await api.get(`/my/ads/${adId}/documents`, {
      params: type ? { type } : undefined,
      ...(request?.signal ? { signal: request.signal } : {}),
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
      { headers: { 'Content-Type': 'multipart/form-data' } }
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
};
