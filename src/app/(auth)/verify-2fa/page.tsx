'use client';

import MfaChallengeForm from '@/components/auth/MfaChallengeForm';

/**
 * Second factor for the client login.
 *
 * The pending ticket is held in memory by `@/lib/auth/mfa-challenge`, so this
 * route is only reachable through a client-side navigation from `/login`; a
 * direct hit or a reload renders the "reconnectez-vous" panel.
 */
export default function VerifyTwoFactorPage() {
  return <MfaChallengeForm context="client" />;
}
