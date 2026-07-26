/**
 * NLP-parsed search parameters returned by POST /api/v1/ads/search/parse.
 *
 * Single source of truth — consumed by HeroSection (landing), HeroSearch (home),
 * OwnerNlpSearch (owner panel), and the buildNlpParams() URL builder.
 *
 * Customer-side fields are required to all be optional; the owner-side endpoint
 * adds extra keys (boost_status, status, is_visible, …) under the same shape
 * for forward compatibility — clients ignore unknown keys.
 */
export interface ParsedSearchParams {
  q?: string | null;
  city_name?: string | null;
  city_id?: string | null;
  type_id?: string | null;
  type_name?: string | null;
  quarter_name?: string | null;
  transaction_type?: string | null;
  bedrooms?: number | null;
  price_max?: number | null;
  price_min?: number | null;
  surface_min?: number | null;
  has_parking?: boolean | null;
  furnished?: boolean | null;

  // Owner-context extras (optional — only present when owner_context=true).
  status?: string | null;
  boost_status?: 'boosted' | 'not_boosted' | null;
  is_visible?: boolean | null;
  views_min?: number | null;
  views_max?: number | null;
}
