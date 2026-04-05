import { AxiosError } from 'axios';

const DEFAULT_ERROR = 'Une erreur est survenue. Veuillez réessayer.';

/**
 * Extract validation errors from a 422 response (Laravel format).
 * Returns all field errors joined, or null.
 */
function getValidationErrors(
  error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>
): string | null {
  const data = error.response?.data;
  const errors = data?.errors;
  if (!errors) return data?.message || null;

  const messages = Object.values(errors).flat();
  return messages.length > 0 ? messages.join(' ') : null;
}

/**
 * Get the error message directly from the API response.
 * For 422 (validation), returns specific field errors from Laravel.
 * For all other codes, returns the response `message` field as-is.
 */
const NETWORK_TIMEOUT_FR =
  "Impossible de joindre le serveur (délai dépassé). Vérifiez que l'API Laravel tourne, que NEXT_PUBLIC_API_URL dans .env.local pointe vers la bonne adresse (ex. http://127.0.0.1:8000/api/v1 plutôt que localhost si la connexion reste bloquée), puis réessayez.";

function isAxiosNetworkOrTimeout(error: unknown): boolean {
  if (!(error instanceof AxiosError) || error.response) {
    return false;
  }
  const code = error.code;
  if (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ETIMEDOUT'
  ) {
    return true;
  }
  const msg = (error.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('network error');
}

export function getSafeErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR
): string {
  if (isAxiosNetworkOrTimeout(error)) {
    return NETWORK_TIMEOUT_FR;
  }

  if (!(error instanceof AxiosError) || !error.response) {
    // Propagate plain Error messages (e.g. thrown by AuthProvider for role restrictions)
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }

  const status = error.response.status;
  const data = error.response.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;

  // For validation errors, return specific field errors from Laravel
  if (status === 422) {
    const validationMsg = getValidationErrors(
      error as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>
    );
    if (validationMsg) return validationMsg;
  }

  // Return the message from the API response directly
  if (data?.message) {
    return data.message;
  }

  return fallback;
}
