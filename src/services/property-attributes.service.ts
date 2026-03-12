import api from '@/lib/api';

export interface PropertyAttributeApiItem {
  value: string;
  label: string;
  icon: string;
  admin_icon: string;
  category?: {
    id: number | null;
    name: string | null;
    slug: string | null;
  };
}

export interface PropertyAttributeGroup {
  id: number;
  name: string;
  slug: string;
  attributes: Array<{
    value: string;
    label: string;
    icon: string;
    admin_icon: string;
  }>;
}

type PropertyAttributesResponse = {
  success: boolean;
  data: Record<string, PropertyAttributeApiItem>;
  grouped: PropertyAttributeGroup[];
};

export const propertyAttributesService = {
  async list(): Promise<PropertyAttributesResponse> {
    const { data } = await api.get('/property-attributes');
    return data;
  },
};
