'use client';

import MfaChallengeForm from '@/components/auth/MfaChallengeForm';

/**
 * Second factor for the owner (bailleur) login — same form, teal accent and a
 * redirect back to `/owner/login` when the ticket is gone.
 */
export default function OwnerVerifyTwoFactorPage() {
  return <MfaChallengeForm context="owner" />;
}
