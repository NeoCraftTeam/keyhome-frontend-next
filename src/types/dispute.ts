// ── Dispute domain types ────────────────────────────────────
// Mirrors the API resources: DisputeResource, DisputeMessageResource,
// DisputeEvidenceResource.

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'mediation'
  | 'resolved_initiator'
  | 'resolved_respondent'
  | 'resolved_amicably'
  | 'rejected';

export type DisputeType =
  | 'deposit'
  | 'repair'
  | 'lease_termination'
  | 'payment'
  | 'access_refused'
  | 'misrepresentation'
  | 'other';

export type DisputeEvidenceType =
  | 'photo'
  | 'document'
  | 'screenshot'
  | 'contract'
  | 'receipt'
  | 'other';

export interface DisputeParty {
  id: string;
  name: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender?: {
    id: string;
    name: string;
    is_admin: boolean;
  };
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploader_id: string;
  type: DisputeEvidenceType;
  type_label: string;
  original_name: string;
  mime_type: string;
  size_bytes: number | null;
  url: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  reference: string;
  type: DisputeType;
  type_label: string;
  status: DisputeStatus;
  status_label: string;
  is_open: boolean;
  is_resolved: boolean;
  initiator: DisputeParty;
  respondent: DisputeParty;
  admin?: DisputeParty | null;
  ad_id: string | null;
  lease_id: string | null;
  payment_id: string | null;
  title: string;
  description: string;
  amount_claimed: number | null;
  resolution_note?: string | null;
  sla_deadline: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  messages?: DisputeMessage[];
  evidences?: DisputeEvidence[];
  allowed_transitions?: DisputeStatus[];
}

/**
 * Dispute creation payload.
 *
 * `respondent_id` is OPTIONAL when at least one of `ad_id`, `lease_id` or
 * `payment_id` is provided — the backend derives the counterparty from that
 * context (e.g. `ad_id` → ad owner). At least one of (respondent_id, ad_id,
 * lease_id, payment_id) must be present.
 */
export interface CreateDisputePayload {
  type: DisputeType;
  respondent_id?: string | null;
  title: string;
  description: string;
  amount_claimed?: number | null;
  ad_id?: string | null;
  lease_id?: string | null;
  payment_id?: string | null;
}
