import type { AdFormValues } from '@/components/owner/ad-form/types';
import { AD_FORM_MAP_DEFAULT_LAT } from '@/components/owner/ad-form/types';

export interface ListingQualityResult {
  score: number;
  label: 'faible' | 'correcte' | 'bonne' | 'excellente';
  color: 'error' | 'warning' | 'success';
  missing: string[];
}

/**
 * Computes a 0-100 quality score for a listing being created/edited.
 *
 * Breakdown:
 *  - Photos (0-40 pts): 8 pts per photo, capped at 5 photos
 *  - Description ≥ 100 words (20 pts)
 *  - Price filled (15 pts)
 *  - Surface filled (10 pts)
 *  - GPS customised from default (10 pts)
 *  - 3D tour present (5 pts)
 */
export function computeListingQuality(
  values: AdFormValues,
  photosCount: number,
  has3dTour = false
): ListingQualityResult {
  let score = 0;
  const missing: string[] = [];

  const photoPoints = Math.min(photosCount * 8, 40);
  score += photoPoints;
  if (photosCount < 5) {
    const needed = 5 - photosCount;
    missing.push(
      `Ajoutez ${needed} photo${needed > 1 ? 's' : ''} (min. recommandé : 5)`
    );
  }

  const wordCount = values.description
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (wordCount >= 100) {
    score += 20;
  } else {
    missing.push(
      `Description trop courte (${wordCount} mot${wordCount > 1 ? 's' : ''}, min. 100)`
    );
  }

  if (values.price !== '' && Number(values.price) > 0) {
    score += 15;
  } else {
    missing.push('Prix non renseigné');
  }

  if (values.surface_area !== '' && Number(values.surface_area) > 0) {
    score += 10;
  } else {
    missing.push('Surface non renseignée');
  }

  if (values.latitude !== AD_FORM_MAP_DEFAULT_LAT) {
    score += 10;
  } else {
    missing.push('Localisez précisément votre bien sur la carte');
  }

  if (has3dTour) {
    score += 5;
  }

  const clamped = Math.min(100, Math.max(0, score));

  const label: ListingQualityResult['label'] =
    clamped >= 80
      ? 'excellente'
      : clamped >= 60
        ? 'bonne'
        : clamped >= 40
          ? 'correcte'
          : 'faible';

  const color: ListingQualityResult['color'] =
    clamped >= 60 ? 'success' : clamped >= 40 ? 'warning' : 'error';

  return { score: clamped, label, color, missing };
}
