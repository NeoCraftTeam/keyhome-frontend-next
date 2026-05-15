/**
 * Clerk dashboard "required" fields must be satisfied for sign-up to complete, but
 * we never send `phone_number` to Clerk — phone is stored only via Laravel
 * (`completeClerkProfile` / profile PATCH) after the user exists.
 */

export type ClerkSignUpPatch = {
  firstName?: string;
  lastName?: string;
  legalAccepted?: boolean;
};

type SignUpLike = {
  missingFields?: readonly string[] | null;
  firstName?: string | null;
  lastName?: string | null;
};

function fieldMissing(
  missing: readonly string[] | null | undefined,
  matchers: string[]
): boolean {
  const list = missing ?? [];
  return list.some((f) => {
    const n = String(f).toLowerCase();
    return matchers.some((m) => {
      const mLower = m.toLowerCase();
      return (
        f === m ||
        n === mLower ||
        n.replace(/_/g, '') === mLower.replace(/_/g, '')
      );
    });
  });
}

export function clerkMissingPhoneOnly(
  missing: readonly string[] | null | undefined
): boolean {
  const list = missing ?? [];
  if (list.length === 0) {
    return false;
  }
  return list.every(
    (f) =>
      /phone/i.test(String(f)) ||
      f === 'phone_number' ||
      f === 'phoneNumber' ||
      f === 'primary_phone_number'
  );
}

export function buildClerkSignUpPatch(
  signUp: SignUpLike,
  opts: {
    prefill: { firstname?: string; lastname?: string } | null;
    extraLastName?: string;
    /** "Passer" — only flip legal checkbox when Clerk requires it */
    legalOnly?: boolean;
  }
): { patch: ClerkSignUpPatch; blockedByPhoneOnly: boolean } {
  const missing = signUp.missingFields ?? [];
  const patch: ClerkSignUpPatch = {};

  if (opts.legalOnly) {
    if (fieldMissing(missing, ['legal_accepted', 'legalAccepted'])) {
      patch.legalAccepted = true;
    }
    return { patch, blockedByPhoneOnly: false };
  }

  if (fieldMissing(missing, ['legal_accepted', 'legalAccepted'])) {
    patch.legalAccepted = true;
  }

  if (fieldMissing(missing, ['first_name', 'firstName'])) {
    const fn =
      opts.prefill?.firstname?.trim() || signUp.firstName?.trim() || '';
    if (fn.length > 0) {
      patch.firstName = fn;
    }
  }

  if (fieldMissing(missing, ['last_name', 'lastName'])) {
    const ln =
      opts.extraLastName?.trim() ||
      opts.prefill?.lastname?.trim() ||
      signUp.lastName?.trim() ||
      '';
    if (ln.length > 0) {
      patch.lastName = ln;
    }
  }

  return {
    patch,
    blockedByPhoneOnly: clerkMissingPhoneOnly(missing),
  };
}
