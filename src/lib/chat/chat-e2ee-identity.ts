/**
 * Auto-bootstrap of the per-device chat E2EE identity.
 *
 * ⚠️ INACTIVE BY DEFAULT — May 2026.
 *
 * The client-sealed (E2EE) chat path is disabled in production: the server
 * config flag `chat.client_sealed_enabled` defaults to `false`, and the
 * `AuthProvider` no longer calls `syncChatE2eePublicKeyWithServer` at startup
 * (see AGENTS.md — « Chat — désactivation E2EE par défaut »). The module is
 * kept intact so re-enabling E2EE only requires:
 *
 *   1. Set `CHAT_CLIENT_SEALED_ENABLED=true` in the backend `.env`.
 *   2. Uncomment the `syncChatE2eePublicKeyWithServer` call in
 *      `AuthProvider.tsx` (and re-import the helper + `rtrimPem`).
 *   3. Set `wantsE2ee` back to its original condition in `useChat.ts`.
 *
 * Original purpose (kept for reference): when sealed messages are active,
 * every device must own an RSA-OAEP keypair so peers can wrap a session AES
 * key for it. Without this bootstrap, a fresh device would never decrypt
 * incoming sealed messages.
 */

import api from '@/lib/api';
import { ensureLocalE2eeIdentity, rtrimPem } from '@/lib/chat/chat-e2ee-crypto';

const inFlightByUser = new Map<string, Promise<string | null>>();

export const CHAT_E2EE_READY_EVENT = 'kh:chat-e2ee-ready';

function dispatchE2eeReady(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(CHAT_E2EE_READY_EVENT));
}

/**
 * Make sure the device has an RSA-OAEP keypair, push the public PEM to the
 * backend if it differs from what the server currently has, and return the
 * up-to-date local public PEM.
 *
 * @param serverPem  The user's currently registered public PEM (passed in so
 *                    we can avoid an extra round-trip when the caller already
 *                    has it from `/auth/me`).
 * @param userId      Authenticated user id (required for per-user key storage).
 * @returns           The up-to-date local public PEM, or `null` if the bootstrap
 *                    failed (caller should not throw — chat falls back to
 *                    server-encrypted messages).
 */
export function syncChatE2eePublicKeyWithServer(
  serverPem: string | null,
  userId: string
): Promise<string | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return Promise.resolve(null);
  }
  if (!userId) {
    return Promise.resolve(null);
  }

  const existing = inFlightByUser.get(userId);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      let canonicalServer: string | null = serverPem;
      if (canonicalServer === null) {
        try {
          const { data } = await api.get<{ public_key_pem: string | null }>(
            '/my/chat-e2ee/public-key'
          );
          canonicalServer = data?.public_key_pem ?? null;
        } catch {
          /* read failure is non-fatal — fall through to ensure local key */
        }
      }

      const { publicPem } = await ensureLocalE2eeIdentity(
        canonicalServer,
        userId
      );

      const localNorm = rtrimPem(publicPem);
      const serverNorm = canonicalServer ? rtrimPem(canonicalServer) : '';

      if (localNorm !== serverNorm) {
        try {
          await api.put('/my/chat-e2ee/public-key', {
            public_key_pem: publicPem,
          });
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[chat-e2ee] failed to push public key to server',
              err
            );
          }
        }
      }

      dispatchE2eeReady();
      return publicPem;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[chat-e2ee] identity bootstrap failed', err);
      }
      return null;
    } finally {
      queueMicrotask(() => {
        inFlightByUser.delete(userId);
      });
    }
  })();

  inFlightByUser.set(userId, promise);
  return promise;
}

/**
 * Force-clear in-flight bootstrap promises. Use on logout so state does not leak
 * across sessions.
 */
export function resetChatE2eeBootstrap(): void {
  inFlightByUser.clear();
}
