import api from '@/lib/api';
import { Ad } from '@/types';

export interface AgencyProfile {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  owner?: {
    id: string;
    firstname: string;
    lastname: string;
    avatar: string | null;
    created_at: string;
  };
  users_count?: number;
  created_at: string;
  updated_at: string;
}

interface AgencyShowResponse {
  success: boolean;
  data: AgencyProfile;
  ads: Ad[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  } | null;
}

export const agencyService = {
  async getProfile(agencyId: string): Promise<AgencyShowResponse> {
    const { data } = await api.get<AgencyShowResponse>(`/agencies/${agencyId}`);
    return data;
  },
};
