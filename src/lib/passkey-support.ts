/**
 * User-facing WebAuthn / passkey environment checks and error copy (FR).
 */

export function isLocalhostLikeHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.test')
  );
}

/**
 * When `isWebAuthnSupported()` is false, returns a concise French explanation.
 */
export function explainPasskeyUnsupported(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  if (!window.isSecureContext) {
    if (!isLocalhostLikeHostname(window.location.hostname)) {
      return 'Les passkeys exigent une connexion sécurisée (HTTPS).';
    }
  }

  if (
    typeof PublicKeyCredential === 'undefined' ||
    typeof navigator === 'undefined' ||
    typeof navigator.credentials === 'undefined'
  ) {
    return 'Votre navigateur ne prend pas en charge WebAuthn. Utilisez une version récente de Safari, Chrome ou Firefox.';
  }

  return 'Les passkeys ne sont pas disponibles dans ce contexte (navigateur intégré, restrictions de sécurité, etc.).';
}

/**
 * Maps browser / WebAuthn errors to French copy for registration and similar flows.
 */
export function formatWebAuthnClientError(
  err: unknown,
  fallback: string
): string {
  if (err !== null && typeof err === 'object' && 'name' in err) {
    const name = String((err as { name?: string }).name);
    switch (name) {
      case 'NotAllowedError':
        return 'Opération annulée ou refusée (prompt fermé, timeout ou permission refusée).';
      case 'InvalidStateError':
        return 'Cette passkey existe déjà ou l’authentificateur n’est plus utilisable dans cet état.';
      case 'NotSupportedError':
        return 'Authentificateur ou méthode non prise en charge sur cet appareil.';
      case 'SecurityError':
        return 'Erreur de sécurité : origine ou contexte non valide pour WebAuthn.';
      case 'AbortError':
        return 'La demande a été interrompue.';
      default:
        break;
    }
  }
  if (err instanceof Error) {
    const trimmed = err.message.trim();
    if (trimmed !== '') {
      return trimmed;
    }
  }
  return fallback;
}
