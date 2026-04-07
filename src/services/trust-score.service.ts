import api from '@/lib/api';
import type {
  TrustScoreData,
  TrustScoreConsentResponse,
} from '@/types/trust-score';
import type { AxiosResponse } from 'axios';

export const trustScoreService = {
  get: (userId: string): Promise<TrustScoreData> =>
    api
      .get(`/v1/users/${userId}/trust-score`)
      .then((r: AxiosResponse) => r.data.data),

  me: (): Promise<TrustScoreData | TrustScoreConsentResponse> =>
    api.get('/v1/my/trust-score').then((r: AxiosResponse) => r.data),

  consent: (consent: boolean): Promise<{ consent: boolean; message: string }> =>
    api
      .post('/v1/my/trust-score/consent', { consent })
      .then((r: AxiosResponse) => r.data),
};
