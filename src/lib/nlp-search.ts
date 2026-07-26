import type { ParsedSearchParams } from '@/types/nlp-search';

export type { ParsedSearchParams };

/**
 * Convert an NLP parse result (from POST /ads/search/parse) into
 * URLSearchParams ready to append to /search.
 *
 * Single source of truth — used by HeroSection (landing) and HeroSearch (home)
 * so both surfaces produce identical URLs.
 *
 * When `nlp=1` is present, the /search page signals AdSearchController to keep
 * the natural-language `q` term as the semantic seed for the Cohere embedder
 * (instead of treating it as a literal keyword search).
 */
export function buildNlpParams(parsed: ParsedSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  if (parsed.q) params.set('q', parsed.q);
  if (parsed.city_name) params.set('city', parsed.city_name);
  if (parsed.type_id) params.set('type_id', String(parsed.type_id));
  else if (parsed.type_name) params.set('type', parsed.type_name);
  if (parsed.quarter_name) params.set('quarter', parsed.quarter_name);
  if (parsed.bedrooms) params.set('bedrooms', String(parsed.bedrooms));
  if (parsed.price_max) params.set('price_max', String(parsed.price_max));
  if (parsed.price_min) params.set('price_min', String(parsed.price_min));
  if (parsed.surface_min) params.set('surface_min', String(parsed.surface_min));
  if (parsed.transaction_type)
    params.set('transaction_type', parsed.transaction_type);
  if (parsed.has_parking) params.set('parking', '1');
  if (parsed.furnished) params.set('furnished', '1');
  params.set('nlp', '1');
  return params;
}
