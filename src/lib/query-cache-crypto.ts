'use client';

/**
 * Chiffrement du cache de requêtes persisté — modèle WhatsApp Web :
 *
 *  - clé **AES-GCM 256 non extractible** générée par WebCrypto et rangée
 *    en IndexedDB (le XSS ne peut pas l'exporter, `extractable: false`) ;
 *  - les snapshots du cache chat (inbox, fils, non-lus) sont chiffrés
 *    avant d'atterrir dans localStorage — le disque ne contient que du
 *    ciphertext ;
 *  - IV aléatoire de 96 bits par écriture, préfixé au ciphertext
 *    (construction AES-GCM canonique), le tout encodé en base64.
 *
 * Résultat : ouverture de page INSTANTANÉE depuis le cache local (puis
 * resync en arrière-plan), sans exposer les conversations en clair.
 */

const DB_NAME = 'kh-secure-store';
const DB_STORE = 'keys';
const KEY_ID = 'chat-cache-aes-gcm-v1';
const IV_BYTES = 12; // 96 bits — taille recommandée pour AES-GCM

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

function idbGet(db: IDBDatabase, id: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(DB_STORE, 'readonly')
      .objectStore(DB_STORE)
      .get(id);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error ?? new Error('indexedDB get failed'));
  });
}

function idbPut(db: IDBDatabase, id: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('indexedDB put failed'));
  });
}

let keyPromise: Promise<CryptoKey> | null = null;

/** Charge la clé AES-GCM du cache — la crée au premier usage. */
export function getCacheCryptoKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const db = await openKeyDb();
    const existing = await idbGet(db, KEY_ID);
    if (existing) {
      return existing;
    }
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractible : la clé ne quitte jamais le navigateur
      ['encrypt', 'decrypt']
    );
    await idbPut(db, KEY_ID, key);
    return key;
  })();
  return keyPromise;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** Chiffre une chaîne → base64(iv ‖ ciphertext+tag GCM). */
export async function encryptForCache(plain: string): Promise<string> {
  const key = await getCacheCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const out = new Uint8Array(IV_BYTES + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), IV_BYTES);
  return toBase64(out);
}

/** Déchiffre base64(iv ‖ ciphertext+tag) → chaîne. Jette si illisible. */
export async function decryptFromCache(payload: string): Promise<string> {
  const key = await getCacheCryptoKey();
  const bytes = fromBase64(payload);
  const iv = bytes.slice(0, IV_BYTES);
  const cipher = bytes.slice(IV_BYTES);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  return new TextDecoder().decode(plain);
}
