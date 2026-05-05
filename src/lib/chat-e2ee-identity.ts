/**
 * Auto-bootstrap of the per-device chat E2EE identity.
 *
 * This is what makes sealed messages actually decryptable end-to-end. Without
 * it, every device that has not previously generated a keypair sees received
 * sealed messages stuck on "🔐 Déchiffrement du message…" forever, because:
 *
 *   - `getChatE2eePrivateKey()` returns null
 *   - `aesGcmDecrypt()` is never called
 *   - The bubble's `decrypted_body` stays null → fallback string is shown
 *
 * The function is idempotent and safe to call on every auth state change. It
 * is wired in `AuthProvider` so that the moment the user is signed in, the
 * device's RSA identity is materialised and the public PEM is synced with
 * the backend so peers can wrap session AES keys for this device.
 */

import api from '@/lib/api';
import { ensureLocalE2eeIdentity, rtrimPem } from '@/lib/chat-e2ee-crypto';

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
