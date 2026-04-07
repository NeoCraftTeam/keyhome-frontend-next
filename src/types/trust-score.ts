export interface TrustScoreBreakdownItem {
  score: number;
  max: number;
  label: string;
  value: string;
  tip: string;
}

export interface TrustScoreData {
  score: number;
  tier: TrustScoreTier;
  tier_label: string;
  tier_color: string;
  role_context: 'tenant' | 'landlord';
  breakdown: Record<string, TrustScoreBreakdownItem>;
  computed_at: string | null;
  tips: string[];
}

export interface TrustScorePublic {
  score: number;
  tier: TrustScoreTier;
  tier_label: string;
  tier_color: string;
}

export interface TrustScoreConsentResponse {
  consent_required?: boolean;
  consent_declined?: boolean;
  score?: number | null;
  message?: string;
}

export type TrustScoreTier =
  | 'non_verifie'
  | 'bronze'
  | 'argent'
  | 'or'
  | 'platine';

export const TRUST_SCORE_TIERS: Record<
  TrustScoreTier,
  { label: string; color: string; minScore: number }
> = {
  non_verifie: { label: 'Non vérifié', color: '#9CA3AF', minScore: 0 },
  bronze: { label: 'Bronze', color: '#D97706', minScore: 20 },
  argent: { label: 'Argent', color: '#64748B', minScore: 40 },
  or: { label: 'Or', color: '#EAB308', minScore: 60 },
  platine: { label: 'Platine', color: '#0D9488', minScore: 80 },
};
