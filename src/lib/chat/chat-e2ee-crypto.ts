/**
 * Client-side primitives for chat E2EE (RSA-OAEP-256 key wrap + AES-GCM).
 * Private key material never leaves the device (stored in localStorage — XSS caveat).
 *
 * ⚠️ INACTIVE BY DEFAULT — May 2026.
 *
 * The sealed-message path is disabled in production: `chat.client_sealed_enabled`
 * defaults to `false` server-side, and the frontend's `useChat` sets `wantsE2ee = false`
 * unconditionally. These primitives are preserved verbatim so a future portable-E2EE
 * design (server-stored RSA private key encrypted with a user passphrase, à la
 * Signal Desktop / ProtonMail) can reuse them — see AGENTS.md
 * (« Chat — désactivation E2EE par défaut »).
 */

/** Legacy single-bucket key (pre–per-user storage). Migrated on first read per account. */
const LEGACY_E2EE_STORAGE_KEY = 'kh:chat-e2ee:v1';

export type StoredE2eeIdentity = {
  privateJwk: JsonWebKey;
  publicPem: string;
};

function rtrimPem(pem: string): string {
  return pem.trim().replace(/\r\n/g, '\n');
}

/**
 * Per-user storage key so multiple accounts on one browser do not share an identity,
 * and identities can be retained across logout (see `wipeBrowserStoragesForLogout`).
 */
export function chatE2eeStorageKeyForUser(userId: string): string {
  return `${LEGACY_E2EE_STORAGE_KEY}:${userId}`;
}

function readStored(userId: string): StoredE2eeIdentity | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const namespaced = localStorage.getItem(chatE2eeStorageKeyForUser(userId));
  if (namespaced) {
    try {
      return JSON.parse(namespaced) as StoredE2eeIdentity;
    } catch {
      return null;
    }
  }
  const legacy = localStorage.getItem(LEGACY_E2EE_STORAGE_KEY);
  if (!legacy) {
    return null;
  }
  try {
    const parsed = JSON.parse(legacy) as StoredE2eeIdentity;
    localStorage.setItem(chatE2eeStorageKeyForUser(userId), legacy);
    localStorage.removeItem(LEGACY_E2EE_STORAGE_KEY);
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(userId: string, data: StoredE2eeIdentity): void {
  localStorage.setItem(chatE2eeStorageKeyForUser(userId), JSON.stringify(data));
}

function pemPublicKeyToSpkiDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/gi, '')
    .replace(/-----END PUBLIC KEY-----/gi, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function spkiDerToPem(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----\n`;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function importRsaPublicKeyFromPem(
  pem: string
): Promise<CryptoKey> {
  const der = pemPublicKeyToSpkiDer(pem);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

async function importRsaPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

async function generateRsaKeyPairAndPersist(userId: string): Promise<{
  privateKey: CryptoKey;
  publicPem: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicPem = spkiDerToPem(spki);
  writeStored(userId, {
    privateJwk: privJwk,
    publicPem,
  });
  return { privateKey: keyPair.privateKey, publicPem };
}

/**
 * Ensures a local RSA identity exists and matches the server SPKI PEM when provided.
 * Regenerates keys if storage is missing or PEM does not match (device reset / key rotation).
 */
export async function ensureLocalE2eeIdentity(
  serverPublicPem: string | null | undefined,
  userId: string
): Promise<{ privateKey: CryptoKey; publicPem: string }> {
  if (!crypto.subtle) {
    throw new Error('Web Crypto API unavailable');
  }

  const stored = readStored(userId);
  const want = serverPublicPem ? rtrimPem(serverPublicPem) : '';

  if (stored?.privateJwk && stored.publicPem) {
    const have = rtrimPem(stored.publicPem);
    if (!want || have === want) {
      return {
        privateKey: await importRsaPrivateKeyFromJwk(stored.privateJwk),
        publicPem: stored.publicPem,
      };
    }
  }

  return generateRsaKeyPairAndPersist(userId);
}

export async function getChatE2eePrivateKey(
  userId: string | null | undefined
): Promise<CryptoKey | null> {
  if (!userId) {
    return null;
  }
  const stored = readStored(userId);
  if (!stored?.privateJwk) {
    return null;
  }
  try {
    return await importRsaPrivateKeyFromJwk(stored.privateJwk);
  } catch {
    return null;
  }
}

export async function createConversationAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

export async function exportAesRawKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

export async function importAesRawKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function rsaOaepWrap(
  publicKey: CryptoKey,
  rawAes: ArrayBuffer
): Promise<string> {
  const wrapped = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawAes
  );
  return arrayBufferToBase64(wrapped);
}

export async function rsaOaepUnwrap(
  privateKey: CryptoKey,
  wrappedB64: string
): Promise<CryptoKey> {
  const rawCipher = base64ToArrayBuffer(wrappedB64);
  const rawAes = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    rawCipher
  );
  return importAesRawKey(rawAes);
}

export async function aesGcmEncrypt(
  aesKey: CryptoKey,
  plaintext: string
): Promise<{ ciphertextB64: string; ivB64: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext)
  );
  return {
    ciphertextB64: arrayBufferToBase64(ciphertext),
    ivB64: arrayBufferToBase64(iv.buffer),
  };
}

export async function aesGcmDecrypt(
  aesKey: CryptoKey,
  ciphertextB64: string,
  ivB64: string
): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(base64ToArrayBuffer(ivB64)),
    },
    aesKey,
    base64ToArrayBuffer(ciphertextB64)
  );
  return new TextDecoder().decode(plain);
}

export { rtrimPem };

// ─── Sealed-message payload helpers ──────────────────────────────────────────
// Moved here from useChat.ts so they can be imported by useChatSend and
// tested independently without mounting a React component.

import type { SendMessageInput } from '@/lib/chat/chat-api';
import type { Conversation } from '@/types/chat';

/**
 * Cache key for the per-conversation AES session key.
 * Format: `{userId}:{conversationUuid}`
 */
export function convSessionAesMapKey(
  userId: string,
  conversationUuid: string
): string {
  return `${userId}:${conversationUuid}`;
}

/**
 * Build the `SendMessageInput` payload for a client-sealed (E2EE) message.
 *
 * 1. If an AES session key is already cached for this conversation → encrypt directly.
 * 2. If the server has a wrapped conversation key → unwrap with local RSA private key, cache, encrypt.
 * 3. Otherwise → generate a new AES key, wrap it for both participants, encrypt.
 *
 * Throws if E2EE keys are missing or the local private key is not available.
 */
export async function buildSealedMessagePayload(
  conv: Conversation,
  conversationUuid: string,
  plaintext: string,
  convAesKeyRef: { current: Map<string, CryptoKey> },
  userId: string
): Promise<SendMessageInput> {
  const e2ee = conv.e2ee;
  if (!e2ee?.tenant_public_key_pem || !e2ee.landlord_public_key_pem) {
    throw new Error('E2EE keys missing');
  }

  const sessionKey = convSessionAesMapKey(userId, conversationUuid);
  const cachedAes = convAesKeyRef.current.get(sessionKey) ?? null;
  if (cachedAes) {
    const { ciphertextB64, ivB64 } = await aesGcmEncrypt(cachedAes, plaintext);
    return {
      is_client_sealed: true,
      e2ee_ciphertext_b64: ciphertextB64,
      e2ee_iv_b64: ivB64,
    };
  }

  if (e2ee.session_ready && e2ee.wrapped_conversation_key_b64) {
    const priv = await getChatE2eePrivateKey(userId);
    if (!priv) throw new Error('No local E2EE private key');
    const aesKey = await rsaOaepUnwrap(priv, e2ee.wrapped_conversation_key_b64);
    convAesKeyRef.current.set(sessionKey, aesKey);
    const { ciphertextB64, ivB64 } = await aesGcmEncrypt(aesKey, plaintext);
    return {
      is_client_sealed: true,
      e2ee_ciphertext_b64: ciphertextB64,
      e2ee_iv_b64: ivB64,
    };
  }

  const aesKey = await createConversationAesKey();
  convAesKeyRef.current.set(sessionKey, aesKey);
  const raw = await exportAesRawKey(aesKey);
  const tenantPub = await importRsaPublicKeyFromPem(e2ee.tenant_public_key_pem);
  const landlordPub = await importRsaPublicKeyFromPem(
    e2ee.landlord_public_key_pem
  );
  const wrappedTenant = await rsaOaepWrap(tenantPub, raw);
  const wrappedLandlord = await rsaOaepWrap(landlordPub, raw);
  const enc = await aesGcmEncrypt(aesKey, plaintext);
  return {
    is_client_sealed: true,
    e2ee_ciphertext_b64: enc.ciphertextB64,
    e2ee_iv_b64: enc.ivB64,
    e2ee_wrapped_keys: { tenant: wrappedTenant, landlord: wrappedLandlord },
  };
}
