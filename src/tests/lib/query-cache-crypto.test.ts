import 'fake-indexeddb/auto';

import { describe, expect, it, vi } from 'vitest';

import {
  decryptFromCache,
  encryptForCache,
  getCacheCryptoKey,
} from '@/lib/query-cache-crypto';

/**
 * Tests du chiffrement du cache chat contre la VRAIE WebCrypto de Node
 * et un IndexedDB en mémoire (fake-indexeddb) : round-trip AES-GCM,
 * aléa d'IV, intégrité (tag GCM), non-extractibilité de la clé.
 */

describe('query-cache-crypto — AES-GCM 256', () => {
  it('round-trip : encrypt puis decrypt redonne le texte original', async () => {
    const plain = JSON.stringify({
      messages: ['Bonjour « chez vous » 🏠', 42],
    });
    const cipher = await encryptForCache(plain);

    expect(cipher).not.toContain('Bonjour');
    await expect(decryptFromCache(cipher)).resolves.toBe(plain);
  });

  it('deux chiffrements du même texte donnent des ciphertexts différents (IV aléatoire)', async () => {
    const plain = 'même contenu';
    const [a, b] = await Promise.all([
      encryptForCache(plain),
      encryptForCache(plain),
    ]);

    expect(a).not.toBe(b);
    await expect(decryptFromCache(a)).resolves.toBe(plain);
    await expect(decryptFromCache(b)).resolves.toBe(plain);
  });

  it('rejette un payload altéré (tag GCM invalide)', async () => {
    const cipher = await encryptForCache('secret');
    const bytes = atob(cipher);
    // Flip un bit en plein ciphertext (après l'IV de 12 octets).
    const tampered = `${bytes.slice(0, 20)}${String.fromCharCode(
      bytes.charCodeAt(20) ^ 0xff
    )}${bytes.slice(21)}`;

    await expect(decryptFromCache(btoa(tampered))).rejects.toThrow();
  });

  it('rejette un payload qui n’est pas du base64 valide', async () => {
    await expect(decryptFromCache('!!!pas-du-base64!!!')).rejects.toThrow();
  });

  it('la clé est non-extractible (exportKey interdit)', async () => {
    const key = await getCacheCryptoKey();

    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });

  it('réutilise la clé stockée en IndexedDB entre deux « sessions » module', async () => {
    const cipher = await encryptForCache('persistant');

    // Simule un rechargement : module ré-importé → keyPromise réinitialisée,
    // mais l’IndexedDB (fake) conserve la clé → déchiffrement toujours possible.
    vi.resetModules();
    const fresh = await import('@/lib/query-cache-crypto');
    await expect(fresh.decryptFromCache(cipher)).resolves.toBe('persistant');
  });
});
