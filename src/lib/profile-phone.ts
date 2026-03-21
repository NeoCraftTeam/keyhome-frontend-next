/**
 * Mirrors Laravel `UserRequest::prepareForValidation()` for phone normalization.
 * Used so we only send `phone_number` on profile update when it’s a complete number (PATCH = partial update).
 */
export function normalizePhoneLikeBackend(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly === '') {
    return '';
  }
  return (hasPlus ? '+' : '') + digitsOnly;
}

/** Same rule as API: optional +, then 7–20 digits total (digit count includes country code). */
export function shouldSendPhoneNumberForUserUpdate(raw: string): boolean {
  const n = normalizePhoneLikeBackend(raw);
  if (!n) {
    return false;
  }
  const digits = n.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 20;
}
