'use client';

import {
  explainPasskeyUnsupported,
  formatWebAuthnClientError,
} from '@/lib/passkey-support';
import { passkeyKeys } from '@/lib/query-keys';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  isWebAuthnSupported,
  PasskeyCredential,
  webAuthnService,
} from '@/services/webauthn.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing passkeys (list, register, rename, delete).
 * Used in both client and owner security/settings pages.
 */
export function usePasskeyManager() {
  const queryClient = useQueryClient();
  const [supported, setSupported] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(
    null
  );

  useEffect(() => {
    const ok = isWebAuthnSupported();
    setSupported(ok);
    setUnsupportedReason(ok ? null : explainPasskeyUnsupported());
  }, []);

  const {
    data: passkeys = [],
    isLoading,
    isError,
    error: listError,
    refetch,
  } = useQuery<PasskeyCredential[]>({
    queryKey: passkeyKeys.all,
    queryFn: () => webAuthnService.list(),
    enabled: supported,
    retry: 1,
  });

  const registerMutation = useMutation({
    mutationFn: (alias?: string) => webAuthnService.register(alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passkeyKeys.all });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, alias }: { id: string; alias: string }) =>
      webAuthnService.rename(id, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passkeyKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => webAuthnService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passkeyKeys.all });
    },
  });

  return {
    supported,
    unsupportedReason,
    passkeys,
    isLoading,
    isError,
    listError,
    refetch,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    rename: renameMutation.mutateAsync,
    isRenaming: renameMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for passkey login — used on login pages.
 */
export function usePasskeyLogin(loginContext: 'owner' | 'client' = 'client') {
  const [supported, setSupported] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(
    null
  );
  useEffect(() => {
    const ok = isWebAuthnSupported();
    setSupported(ok);
    setUnsupportedReason(ok ? null : explainPasskeyUnsupported());
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithPasskey = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await webAuthnService.login(loginContext);
      return result;
    } catch (err: unknown) {
      setError(
        formatWebAuthnClientError(
          err,
          getSafeErrorMessage(err, 'Erreur lors de la connexion par passkey.')
        )
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loginContext]);

  return {
    supported,
    unsupportedReason,
    isLoading,
    error,
    loginWithPasskey,
    clearError: () => setError(null),
  };
}
