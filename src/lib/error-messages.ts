import { AxiosError } from 'axios';

/**
 * Safe, user-facing error messages mapped by HTTP status code.
 * Never expose raw API `data.message` to the UI.
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Requête invalide. Veuillez vérifier vos informations.',
  401: 'Identifiants incorrects. Veuillez réessayer.',
  403: 'Vous n\'avez pas les permissions nécessaires.',
  404: 'Ressource introuvable.',
  409: 'Un conflit est survenu. Veuillez réessayer.',
  422: 'Les données saisies sont invalides. Veuillez corriger les erreurs.',
  429: 'Trop de tentatives. Veuillez patienter quelques instants.',
  500: 'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
  503: 'Le service est temporairement indisponible. Veuillez réessayer plus tard.',
};

const DEFAULT_ERROR = 'Une erreur est survenue. Veuillez réessayer.';

/**
 * Extract validation errors from a 422 response (Laravel format).
 * Returns first validation message if available, otherwise generic message.
 */
function getValidationError(error: AxiosError<{ errors?: Record<string, string[]> }>): string | null {
  const errors = error.response?.data?.errors;
  if (!errors) return null;
  const firstField = Object.values(errors)[0];
  return firstField?.[0] || null;
}

/**
 * Get a safe, user-facing error message from an Axios error.
 * For 422 (validation), returns the first specific validation error.
 * For all other codes, returns a generic French message.
 */
export function getSafeErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR
): string {
  if (!(error instanceof AxiosError) || !error.response) {
    return fallback;
  }

  const status = error.response.status;

  // For validation errors, return specific field errors from Laravel
  if (status === 422) {
    const validationMsg = getValidationError(error as AxiosError<{ errors?: Record<string, string[]> }>);
    if (validationMsg) return validationMsg;
  }

  return ERROR_MESSAGES[status] || fallback;
}
