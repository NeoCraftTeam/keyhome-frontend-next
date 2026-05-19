/**
 * Pure validation helpers for the multi-step ad creation / edit wizard.
 *
 * Extracted from AdFormWizard.tsx to eliminate the duplicated switch blocks
 * that existed in `validateStep` and `validateAll` (same logic copy-pasted).
 *
 * All functions are side-effect free and independently testable.
 */

import {
  type AdFormValues,
  isAdFormTextEmpty,
} from '@/components/owner/ad-form/types';

/** Fields that certain ad type categories hide (e.g. terrain has no bedrooms). */
export type HiddenFields = ReadonlySet<string>;

/** Tour scene shape needed for validation — subset of the full TourScene. */
export interface ValidatableTourScene {
  id: string;
  title: string;
  file: File | null;
  previewUrl: string;
}

/** Shape returned by every validation function. */
export type ValidationErrors = Record<string, string>;

/**
 * Validate a single wizard step.
 *
 * @param step         Zero-based step index (0 = Type, 1 = Info, 2 = Details,
 *                     3 = Conditions/Equipment, 4 = Media, 5 = Review)
 * @param values       Current form values
 * @param options      Context required for steps that need it
 * @returns            An error map — empty object means the step is valid.
 */
export function validateAdFormStep(
  step: number,
  values: AdFormValues,
  options: {
    selectedCategory: string | null;
    hiddenFields: HiddenFields;
    images: File[];
    existingImagesCount: number;
    imagesToDelete: number[];
    tourScenes: ValidatableTourScene[];
    hasExisting3dTour: boolean;
  }
): ValidationErrors {
  const {
    selectedCategory,
    hiddenFields,
    images,
    existingImagesCount,
    imagesToDelete,
    tourScenes,
    hasExisting3dTour,
  } = options;

  const e: ValidationErrors = {};

  switch (step) {
    case 0: {
      // Type & Transaction
      if (!values.transaction_type) {
        e.transaction_type = 'Veuillez choisir le type de transaction.';
      }
      if (!selectedCategory) {
        e.type_id = 'Veuillez choisir une catégorie.';
      } else if (!values.type_id) {
        e.type_id = "Veuillez préciser le type d'annonce.";
      }
      break;
    }

    case 1: {
      // Basic info + photos
      if (isAdFormTextEmpty(values.title)) {
        e.title = 'Le titre est obligatoire.';
      }
      if (isAdFormTextEmpty(values.description)) {
        e.description = 'La description est obligatoire.';
      }
      const existingKept = existingImagesCount - imagesToDelete.length;
      const totalImages = images.length + Math.max(0, existingKept);
      if (totalImages < 4) {
        e.images = 'Veuillez ajouter au moins 4 photos pour continuer.';
      }
      break;
    }

    case 2: {
      // Details — type-specific
      if (!hiddenFields.has('adresse') && isAdFormTextEmpty(values.adresse)) {
        e.adresse = "L'adresse est obligatoire.";
      }
      if (!values.price || parseFloat(values.price) < 0) {
        e.price = 'Le prix est obligatoire.';
      }
      if (
        !hiddenFields.has('surface_area') &&
        (!values.surface_area || parseFloat(values.surface_area) <= 0)
      ) {
        e.surface_area = 'La surface est obligatoire.';
      }
      if (!hiddenFields.has('bedrooms') && parseInt(values.bedrooms, 10) < 0) {
        e.bedrooms = 'Nombre de chambres invalide.';
      }
      if (
        !hiddenFields.has('bathrooms') &&
        parseInt(values.bathrooms, 10) < 0
      ) {
        e.bathrooms = 'Nombre de salles de bain invalide.';
      }
      if (!values.quarter_id) {
        e.quarter_id = 'Le quartier est obligatoire.';
      }
      break;
    }

    case 3: {
      // Equipment & Conditions — optional, no required fields
      break;
    }

    case 4: {
      // Media & Map — validate tour scenes if any
      tourScenes.forEach((scene, i) => {
        if (!scene.title.trim()) {
          e[`tour_scene_${i}_title`] = 'Nom de la pièce obligatoire.';
        }
        if (!scene.file && !hasExisting3dTour) {
          e[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
        }
      });
      break;
    }

    default:
      break;
  }

  return e;
}

/**
 * Validate all wizard steps at once (used on final submit).
 *
 * Returns the merged error map from steps 0–4 (step 5 = Review, no rules).
 * Also returns the index of the first step that contains an error so the
 * wizard can navigate directly to it.
 */
export function validateAllAdFormSteps(
  values: AdFormValues,
  options: Parameters<typeof validateAdFormStep>[2]
): { errors: ValidationErrors; firstInvalidStep: number | null } {
  const allErrors: ValidationErrors = {};

  const stepFieldMap: Record<number, string[]> = {
    0: ['transaction_type', 'type_id'],
    1: ['title', 'description', 'images'],
    2: [
      'adresse',
      'price',
      'surface_area',
      'bedrooms',
      'bathrooms',
      'quarter_id',
    ],
    3: [],
    4: [], // tour_scene_* keys added dynamically below
  };

  for (let step = 0; step <= 4; step++) {
    const stepErrors = validateAdFormStep(step, values, options);
    Object.assign(allErrors, stepErrors);

    // Collect dynamic tour scene keys for step 4
    if (step === 4) {
      Object.keys(stepErrors)
        .filter((k) => k.startsWith('tour_scene_'))
        .forEach((k) => stepFieldMap[4].push(k));
    }
  }

  // Find the first step that has at least one erroring field
  let firstInvalidStep: number | null = null;
  const errorFields = Object.keys(allErrors);
  if (errorFields.length > 0) {
    for (const [stepStr, fields] of Object.entries(stepFieldMap)) {
      if (fields.some((f) => errorFields.includes(f))) {
        firstInvalidStep = Number(stepStr);
        break;
      }
    }
  }

  return { errors: allErrors, firstInvalidStep };
}
