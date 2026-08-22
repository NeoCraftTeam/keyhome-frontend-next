import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  __clearAllChatDrafts,
  readChatDraft,
  useChatDraft,
} from '@/hooks/useChatDrafts';

/**
 * Les brouillons de chat vivent dans une Map au niveau module : ils doivent
 * survivre au remontage de ChatWindow quand on change de conversation puis
 * qu'on revient (comportement WhatsApp). On simule ce remontage avec
 * unmount() + renderHook().
 */
describe('useChatDraft', () => {
  afterEach(() => {
    __clearAllChatDrafts();
  });

  it('renvoie le seed quand aucun brouillon n’est stocké', () => {
    const { result } = renderHook(() => useChatDraft('conv-a', 'Bonjour'));
    expect(result.current[0]).toBe('Bonjour');
    expect(readChatDraft('conv-a')).toBe('Bonjour');
  });

  it('renvoie une chaîne vide sans seed ni brouillon', () => {
    const { result } = renderHook(() => useChatDraft('conv-a'));
    expect(result.current[0]).toBe('');
  });

  it('conserve le brouillon à travers un remontage', () => {
    const first = renderHook(() => useChatDraft('conv-a'));
    act(() => first.result.current[1]('en cours de frappe'));
    expect(first.result.current[0]).toBe('en cours de frappe');
    first.unmount();

    const second = renderHook(() => useChatDraft('conv-a'));
    expect(second.result.current[0]).toBe('en cours de frappe');
  });

  it('isole les brouillons par conversation', () => {
    const a = renderHook(() => useChatDraft('conv-a'));
    act(() => a.result.current[1]('draft A'));
    const b = renderHook(() => useChatDraft('conv-b'));
    expect(b.result.current[0]).toBe('');
    act(() => b.result.current[1]('draft B'));

    expect(readChatDraft('conv-a')).toBe('draft A');
    expect(readChatDraft('conv-b')).toBe('draft B');
  });

  it('efface le brouillon quand on écrit une chaîne vide', () => {
    const { result } = renderHook(() => useChatDraft('conv-a', 'seed'));
    act(() => result.current[1](''));
    expect(result.current[0]).toBe('');
    expect(readChatDraft('conv-a')).toBe('');

    // L'entrée est supprimée : un nouveau montage avec seed re-sème.
    const again = renderHook(() => useChatDraft('conv-a', 'nouveau seed'));
    expect(again.result.current[0]).toBe('nouveau seed');
  });

  it('n’écrase pas un brouillon existant avec le seed', () => {
    const first = renderHook(() => useChatDraft('conv-a'));
    act(() => first.result.current[1]('déjà écrit'));
    first.unmount();

    const second = renderHook(() => useChatDraft('conv-a', 'seed ignoré'));
    expect(second.result.current[0]).toBe('déjà écrit');
  });
});
