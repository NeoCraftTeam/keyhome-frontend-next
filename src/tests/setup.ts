import '@testing-library/jest-dom';

// Force a deterministic timezone for date-formatting tests. Several specs
// assert wall-clock strings against fixed `+02:00` / `+01:00` inputs and
// must run identically regardless of the host machine's TZ.
process.env.TZ = 'Europe/Paris';

/**
 * Node ≥ 22.4 expose un global expérimental `localStorage`/`sessionStorage`
 * (webstorage) qui vaut `undefined` sans `--localstorage-file`. Sa simple
 * présence (`'localStorage' in globalThis`) fait que vitest n'installe PAS
 * le Storage de jsdom → les tests qui touchent au storage cassent avec
 * « Cannot read properties of undefined (reading 'clear') ».
 *
 * On installe un Storage en mémoire — uniquement quand le global courant
 * est inutilisable, donc sans effet sur les versions de Node où jsdom
 * fonctionne normalement. Chaque fichier de test tourne dans son propre
 * environnement vitest → isolation garantie, comme jsdom.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function ensureWorkingStorage(name: 'localStorage' | 'sessionStorage'): void {
  const current = (globalThis as Record<string, unknown>)[name];
  if (
    current &&
    typeof (current as Storage).getItem === 'function' &&
    typeof (current as Storage).setItem === 'function'
  ) {
    return;
  }
  Object.defineProperty(globalThis, name, {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

ensureWorkingStorage('localStorage');
ensureWorkingStorage('sessionStorage');
