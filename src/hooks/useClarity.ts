'use client';

/**
 * Binds Microsoft Clarity `identify` + custom tags to the authenticated
 * KeyHome user from `useAuth()` (Laravel API / Sanctum). Clerk is not used as
 * the primary id — `User.id` is the stable backend UUID when the user is logged in.
 */

import {
  buildClarityFriendlyLabel,
  clarityIdentify,
  claritySet,
  isMicrosoftClarityEnabled,
  subscribeMicrosoftClarityReady,
} from '@/lib/clarity';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useRef } from 'react';

export function useKeyHomeClarity(): void {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isMicrosoftClarityEnabled()) {
      return;
    }

    const id = user?.id;
    if (!id) {
      return;
    }

    let cancelledEffect = false;
    const cancelSubscribe = subscribeMicrosoftClarityReady(() => {
      if (cancelledEffect) {
        return;
      }
      const current = userRef.current;
      if (!current?.id) {
        return;
      }

      clarityIdentify(current.id, buildClarityFriendlyLabel(current) ?? null);

      const roleValue = current.role;
      if (roleValue !== undefined && roleValue !== null) {
        claritySet('user_role', String(roleValue));
      }
      /**
       * `User` currently has no subscription/plan field from the generic profile
       * resource — omit the `plan` tag until API exposes something stable here.
       */
    });

    return () => {
      cancelledEffect = true;
      cancelSubscribe();
    };
  }, [user?.id]);
}

/** Alias for consumers expecting a shorter name. */
export const useClarity = useKeyHomeClarity;
