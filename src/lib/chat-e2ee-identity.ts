import api from '@/lib/api';
import { ensureLocalE2eeIdentity, rtrimPem } from '@/lib/chat-e2ee-crypto';

/**
 * Sync local RSA identity with Laravel: uploads public PEM when missing or out of date.
 * @returns The PEM now authoritative for this device (may match server after PUT).
 */
export async function syncChatE2eePublicKeyWithServer(
  serverPem: string | null | undefined
): Promise<string | null> {
  if (typeof window === 'undefined' || !crypto.subtle) {
    return null;
  }

  const { publicPem } = await ensureLocalE2eeIdentity(serverPem ?? null);
  const srv = serverPem ? rtrimPem(serverPem) : '';
  const loc = rtrimPem(publicPem);

  if (!srv || srv !== loc) {
    await api.put('/my/chat-e2ee/public-key', { public_key_pem: publicPem });
  }

  return publicPem;
}
