'use client';

import { useCallback, useState } from 'react';

/**
 * Brouillons de chat par conversation, conservés dans une Map au niveau module
 * pour survivre au remontage de `ChatWindow` lors d'un changement de conversation
 * (comportement WhatsApp Web). La clé est l'uuid de la conversation.
 */
const drafts = new Map<string, string>();

/** Lit le brouillon courant d'une conversation (chaîne vide si aucun). */
export function readChatDraft(uuid: string): string {
  return drafts.get(uuid) ?? '';
}

function writeChatDraft(uuid: string, value: string): void {
  if (value) {
    drafts.set(uuid, value);
  } else {
    drafts.delete(uuid);
  }
}

/** Réinitialise tous les brouillons — réservé aux tests. */
export function __clearAllChatDrafts(): void {
  drafts.clear();
}

/**
 * Renvoie le brouillon courant d'une conversation et un setter write-through
 * (qui met à jour la Map de module en même temps que l'état local).
 *
 * `seed` (issu de `?draft=`) n'initialise l'entrée que si elle est vide, pour
 * ne pas écraser un brouillon déjà saisi puis mis de côté en changeant de
 * conversation. Écrire une chaîne vide supprime l'entrée.
 */
export function useChatDraft(
  uuid: string,
  seed?: string
): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => {
    const existing = drafts.get(uuid);
    if (existing !== undefined) {
      return existing;
    }
    if (seed) {
      drafts.set(uuid, seed);
      return seed;
    }
    return '';
  });

  const set = useCallback(
    (next: string) => {
      writeChatDraft(uuid, next);
      setValue(next);
    },
    [uuid]
  );

  return [value, set];
}
