import api from '@/lib/api';

export interface PropertyAttributeItem {
  value: string;
  label: string;
  icon: string;
  admin_icon?: string;
  category?: { id: number; name: string; slug: string };
}

export interface PropertyAttributeGroup {
  id: number;
  name: string;
  slug: string;
  attributes: PropertyAttributeItem[];
}

export const propertyAttributesService = {
  async list(): Promise<{ data: PropertyAttributeItem[]; grouped: PropertyAttributeGroup[] }> {
    const { data } = await api.get<{
      data: PropertyAttributeItem[];
      grouped: PropertyAttributeGroup[];
    }>('/property-attributes');
    return data;
  },
};
