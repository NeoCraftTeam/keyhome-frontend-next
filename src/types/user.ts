export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  CUSTOMER = 'customer',
}

export enum UserType {
  INDIVIDUAL = 'individual',
  AGENCY = 'agency',
}

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username?: string | null;
  phone_number?: string | null;
  phone_is_whatsapp?: boolean | null;
  email?: string;
  avatar: string | null;
  display_name: string;
  name?: string;
  agency_name: string | null;
  role?: UserRole | null;
  type?: UserType | null;
  created_at?: string | null;
  updated_at?: string | null;
  city_id: string | null;
  city_name: string | null;
  bio?: string | null;
  point_balance?: number;
  onboarding_completed_at?: string | null;
  last_home_visit_at?: string | null;
  preferences?: { survey_postponed_ids?: string[] };
}
