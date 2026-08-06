import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Le module crypto est mocké avec un « chiffrement » réversible
 * déterministe (préfixe + base64) : on teste ici la logique du
 * persister (throttle, whitelist, fail-safe, verrou de purge), pas
 * AES-GCM — couvert par query-cache-crypto.test.ts.
 */
vi.mock('@/lib/query-cache-crypto', () => ({
  encryptForCache: async (plain: string) => `enc:${btoa(plain)}`,
  decryptFromCache: async (payload: string) => {
    if (!payload.startsWith('enc:')) {
      throw new Error('not a cipher payload');
    }
    return atob(payload.slice(4));
  },
}));

import {
  CHAT_CACHE_STORAGE_KEY,
  clearChatCacheSnapshot,
  createChatCachePersister,
  shouldPersistQuery,
} from '@/lib/query-persister';

function fakeClient(marker: string): PersistedClient {
  return {
    timestamp: Date.now(),
    buster: 'test-buster',
    clientState: {
      mutations: [],
      queries: [
        {
          queryKey: ['conversations', 1],
          queryHash: `hash-${marker}`,
          state: { status: 'success', data: { marker } },
        },
      ],
    },
  } as unknown as PersistedClient;
}

describe('shouldPersistQuery — whitelist chat uniquement', () => {
  it.each([
    [['conversations', 1], true],
    [['chat-messages', 1, 'uuid-1'], true],
    [['chat-unread', 1], true],
    [['credits-balance'], false],
    [['payments', 'history'], false],
    [['ads', 'list'], false],
    [['notifications'], false],
    [[42], false],
    [[], false],
  ])('queryKey %j → %s', (key, expected) => {
    expect(shouldPersistQuery(key)).toBe(expected);
  });
});

describe('createChatCachePersister', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('persiste puis restaure un snapshot (round-trip)', async () => {
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('alpha'));
    await vi.advanceTimersByTimeAsync(1100);

    const restored = await persister.restoreClient();
    expect(restored?.clientState.queries[0]?.state.data).toEqual({
      marker: 'alpha',
    });
  });

  it('ne stocke jamais le JSON en clair dans localStorage', async () => {
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('donnees-sensibles'));
    await vi.advanceTimersByTimeAsync(1100);

    const raw = window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toContain('donnees-sensibles');
    expect(raw).toMatch(/^enc:/);
  });

  it('throttle : deux écritures dans la même seconde → une seule persistée (la dernière)', async () => {
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('first'));
    await persister.persistClient(fakeClient('second'));
    await vi.advanceTimersByTimeAsync(1100);

    const restored = await persister.restoreClient();
    expect(restored?.clientState.queries[0]?.state.data).toEqual({
      marker: 'second',
    });
  });

  it('snapshot corrompu → restore undefined + purge de la clé', async () => {
    window.localStorage.setItem(CHAT_CACHE_STORAGE_KEY, 'pas-du-ciphertext');
    const persister = createChatCachePersister();

    await expect(persister.restoreClient()).resolves.toBeUndefined();
    expect(window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY)).toBeNull();
  });

  it('restore sans snapshot → undefined', async () => {
    const persister = createChatCachePersister();
    await expect(persister.restoreClient()).resolves.toBeUndefined();
  });

  it('removeClient supprime le snapshot', async () => {
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('gone'));
    await vi.advanceTimersByTimeAsync(1100);
    await persister.removeClient();

    expect(window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY)).toBeNull();
  });
});

describe('clearChatCacheSnapshot — verrou de purge (logout)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('bloque toute réécriture après purge, même dans la fenêtre de throttle', async () => {
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('avant-logout'));
    clearChatCacheSnapshot();
    await vi.advanceTimersByTimeAsync(1100);

    expect(window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY)).toBeNull();
  });

  it('ignore les persistClient postérieurs à la purge', async () => {
    clearChatCacheSnapshot();
    const persister = createChatCachePersister();
    await persister.persistClient(fakeClient('apres-logout'));
    await vi.advanceTimersByTimeAsync(1100);

    expect(window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY)).toBeNull();
  });
});
