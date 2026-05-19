'use client';

/**
 * useAdFormStepper — wizard step navigation and per-step validation.
 *
 * Owns:
 *  - activeStep state + handleNext / handleBack / goToStep
 *  - validateStep (single step) + validateAll (all steps, jumps to first error)
 *  - errors state + setErrors
 *
 * Validation logic mirrors AdFormWizard's switch-blocks exactly so both
 * are kept in sync. A future migration to lib/ad-form-validation.ts is tracked
 * in refactor-tasks.md §3.2.
 */

import type { AdFormValues } from '@/components/owner/ad-form/types';
import type { TourScene } from '@/components/owner/ad-form/types';
import type { Ad } from '@/types';
import { useCallback, useState } from 'react';

export interface UseAdFormStepperReturn {
  activeStep: number;
  setActiveStep: (step: number) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleNext: () => void;
  handleBack: () => void;
  goToStep: (step: number) => void;
  validateStep: (step: number) => boolean;
  validateAll: () => boolean;
}

export function useAdFormStepper(
  values: AdFormValues,
  images: File[],
  imagesToDelete: number[],
  tourScenes: TourScene[],
  selectedCategory: string | null,
  hiddenFields: Set<string>,
  stepCount: number,
  ad?: Ad
): UseAdFormStepperReturn {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback(
    (step: number): boolean => {
      const e: Record<string, string> = {};

      switch (step) {
        case 0: {
          if (!values.transaction_type)
            e.transaction_type = 'Veuillez choisir le type de transaction.';
          if (!selectedCategory) e.type_id = 'Veuillez choisir une catégorie.';
          else if (!values.type_id)
            e.type_id = "Veuillez préciser le type d'annonce.";
          break;
        }
        case 1: {
          if (!values.title.trim()) e.title = 'Le titre est obligatoire.';
          if (!values.description.trim())
            e.description = 'La description est obligatoire.';
          const existingCount =
            ad?.images?.filter((img) => !imagesToDelete.includes(img.id))
              .length ?? 0;
          const totalImages = images.length + existingCount;
          if (totalImages < 4)
            e.images = 'Veuillez ajouter au moins 4 photos pour continuer.';
          break;
        }
        case 2: {
          if (!hiddenFields.has('adresse') && !values.adresse.trim())
            e.adresse = "L'adresse est obligatoire.";
          if (!values.price || parseFloat(values.price) < 0)
            e.price = 'Le prix est obligatoire.';
          if (
            !hiddenFields.has('surface_area') &&
            (!values.surface_area || parseFloat(values.surface_area) <= 0)
          )
            e.surface_area = 'La surface est obligatoire.';
          if (
            !hiddenFields.has('bedrooms') &&
            parseInt(values.bedrooms, 10) < 0
          )
            e.bedrooms = 'Nombre de chambres invalide.';
          if (
            !hiddenFields.has('bathrooms') &&
            parseInt(values.bathrooms, 10) < 0
          )
            e.bathrooms = 'Nombre de salles de bain invalide.';
          if (!values.quarter_id) e.quarter_id = 'Le quartier est obligatoire.';
          break;
        }
        case 3:
          break; // Equipment & conditions — no required fields
        case 4: {
          tourScenes.forEach((scene, i) => {
            if (!scene.title.trim())
              e[`tour_scene_${i}_title`] = 'Nom de la pièce obligatoire.';
            if (!scene.file && !ad?.has_3d_tour)
              e[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
          });
          break;
        }
        default:
          break;
      }

      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [
      values,
      images,
      imagesToDelete,
      tourScenes,
      selectedCategory,
      hiddenFields,
      ad,
    ]
  );

  const validateAll = useCallback((): boolean => {
    const allErrors: Record<string, string> = {};

    for (let step = 0; step <= 4; step++) {
      const stepErrors: Record<string, string> = {};
      switch (step) {
        case 0: {
          if (!values.transaction_type)
            stepErrors.transaction_type =
              'Veuillez choisir le type de transaction.';
          if (!selectedCategory)
            stepErrors.type_id = 'Veuillez choisir une catégorie.';
          else if (!values.type_id)
            stepErrors.type_id = "Veuillez préciser le type d'annonce.";
          break;
        }
        case 1: {
          if (!values.title.trim())
            stepErrors.title = 'Le titre est obligatoire.';
          if (!values.description.trim())
            stepErrors.description = 'La description est obligatoire.';
          break;
        }
        case 2: {
          if (!hiddenFields.has('adresse') && !values.adresse.trim())
            stepErrors.adresse = "L'adresse est obligatoire.";
          if (!values.price || parseFloat(values.price) < 0)
            stepErrors.price = 'Le prix est obligatoire.';
          if (
            !hiddenFields.has('surface_area') &&
            (!values.surface_area || parseFloat(values.surface_area) <= 0)
          )
            stepErrors.surface_area = 'La surface est obligatoire.';
          if (!values.quarter_id)
            stepErrors.quarter_id = 'Le quartier est obligatoire.';
          break;
        }
        case 4: {
          tourScenes.forEach((scene, i) => {
            if (!scene.title.trim())
              stepErrors[`tour_scene_${i}_title`] =
                'Nom de la pièce obligatoire.';
            if (!scene.file && !ad?.has_3d_tour)
              stepErrors[`tour_scene_${i}_file`] = 'Photo 360° obligatoire.';
          });
          break;
        }
      }
      Object.assign(allErrors, stepErrors);
    }

    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      const errorFields = Object.keys(allErrors);
      const stepFieldMap: Record<number, string[]> = {
        0: ['transaction_type', 'type_id'],
        1: ['title', 'description'],
        2: ['adresse', 'price', 'surface_area', 'quarter_id'],
        4: errorFields.filter((f) => f.startsWith('tour_scene_')),
      };
      for (const [step, fields] of Object.entries(stepFieldMap)) {
        if (fields.some((f) => errorFields.includes(f))) {
          setActiveStep(Number(step));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        }
      }
      return false;
    }
    return true;
  }, [values, tourScenes, selectedCategory, hiddenFields, ad]);

  const handleNext = useCallback(() => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => Math.min(prev + 1, stepCount - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep, validateStep, stepCount]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToStep = useCallback((step: number) => {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    activeStep,
    setActiveStep,
    errors,
    setErrors,
    handleNext,
    handleBack,
    goToStep,
    validateStep,
    validateAll,
  };
}
