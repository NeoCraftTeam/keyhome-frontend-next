/**
 * Evaluate password strength on a 0–100 scale.
 * Shared between owner and customer profile pages.
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) {
    score += 25;
  }
  if (/[A-Z]/.test(password)) {
    score += 25;
  }
  if (/[0-9]/.test(password)) {
    score += 25;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 25;
  }

  if (score <= 25) {
    return { score, label: 'Faible', color: '#d32f2f' };
  }
  if (score <= 50) {
    return { score, label: 'Moyen', color: '#ed6c02' };
  }
  if (score <= 75) {
    return { score, label: 'Bon', color: '#2e7d32' };
  }
  return { score, label: 'Excellent', color: '#1b5e20' };
}
