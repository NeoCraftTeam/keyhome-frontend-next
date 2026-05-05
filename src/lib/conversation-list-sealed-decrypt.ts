'use client';

import {
  aesGcmDecrypt,
  getChatE2eePrivateKey,
  rsaOaepUnwrap,
} from '@/lib/chat-e2ee-crypto';

const listRowAesByConversation = new Map<string, CryptoKey>();

function cacheKey(userId: string, conversationUuid: string): string {
  return `${userId}:${conversationUuid}`;
}

export type ListRowAesResolve =
  | { status: 'ok'; key: CryptoKey }
  | { status: 'no_identity' }
  | { status: 'unwrap_failed' };

/**
 * Unwraps the per-conversation AES key once per thread for inbox list decrypt.
 * Matches the session key used inside {@link useChat} for the same thread.
 */
export async function resolveListRowAesKey(
  userId: string,
  conversationUuid: string,
  wrappedB64: string
): Promise<ListRowAesResolve> {
  const ck = cacheKey(userId, conversationUuid);
  const hit = listRowAesByConversation.get(ck);
  if (hit) {
    return { status: 'ok', key: hit };
  }
  const priv = await getChatE2eePrivateKey(userId);
  if (!priv) {
    return { status: 'no_identity' };
  }
  try {
    const aes = await rsaOaepUnwrap(priv, wrappedB64);
    listRowAesByConversation.set(ck, aes);

    return { status: 'ok', key: aes };
  } catch {
    return { status: 'unwrap_failed' };
  }
}

export type SealedListDecryptOutcome =
  | { kind: 'plain'; text: string }
  | { kind: 'pending' }
  | { kind: 'failed' };

export async function decryptSealedTextForListPreview(
  userId: string,
  conversationUuid: string,
  wrappedB64: string,
  ciphertextB64: string,
  ivB64: string
): Promise<SealedListDecryptOutcome> {
  const resolved = await resolveListRowAesKey(
    userId,
    conversationUuid,
    wrappedB64
  );
  if (resolved.status === 'no_identity') {
    return { kind: 'pending' };
  }
  if (resolved.status === 'unwrap_failed') {
    return { kind: 'failed' };
  }
  try {
    const text = await aesGcmDecrypt(resolved.key, ciphertextB64, ivB64);
    return { kind: 'plain', text };
  } catch {
    return { kind: 'failed' };
  }
}
