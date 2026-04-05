import api from '@/lib/api';

export type AdReportReason =
  | 'inaccurate'
  | 'not_real_property'
  | 'scam'
  | 'shocking_content'
  | 'other';

export type AdReportScamReason =
  | 'asked_off_platform_payment'
  | 'shared_contacts'
  | 'promoting_external_services'
  | 'duplicate_listing'
  | 'misleading_listing';

export interface CreateAdReportPayload {
  reason: AdReportReason;
  scam_reason?: AdReportScamReason;
  payment_methods?: string[];
  description?: string;
}

export interface CreateAdReportResponse {
  message: string;
  data: {
    id: string;
    status: string;
  };
}

export const adReportsService = {
  async create(
    adId: string,
    payload: CreateAdReportPayload
  ): Promise<CreateAdReportResponse> {
    const { data } = await api.post(`/ads/${adId}/reports`, payload);
    return data as CreateAdReportResponse;
  },
};
