import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchHistory, SearchHistoryItem } from '@/hooks/useSearchHistory';

describe('useSearchHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it('adds a search term', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Yaoundé'); });
    expect(result.current.history.some((h: SearchHistoryItem) => h.query === 'Yaoundé')).toBe(true);
  });

  it('does not add duplicates', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Douala'); });
    act(() => { result.current.addSearch('Douala'); });
    expect(result.current.history.filter((h: SearchHistoryItem) => h.query === 'Douala').length).toBe(1);
  });

  it('moves repeated search to top', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Yaoundé'); });
    act(() => { result.current.addSearch('Douala'); });
    act(() => { result.current.addSearch('Yaoundé'); });
    expect(result.current.history[0].query).toBe('Yaoundé');
  });

  it('removes a search term', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Bastos'); });
    act(() => { result.current.removeSearch('Bastos'); });
    expect(result.current.history.some((h: SearchHistoryItem) => h.query === 'Bastos')).toBe(false);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('AB'); });
    act(() => { result.current.addSearch('CD'); });
    act(() => { result.current.clearHistory(); });
    expect(result.current.history).toEqual([]);
  });

  it('limits history to max items (8 by default)', () => {
    const { result } = renderHook(() => useSearchHistory());
    for (let i = 0; i < 15; i++) {
      act(() => { result.current.addSearch(`City ${i} name`); });
    }
    expect(result.current.history.length).toBeLessThanOrEqual(8);
  });

  it('filters suggestions by query', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Yaoundé'); });
    act(() => { result.current.addSearch('Douala'); });
    act(() => { result.current.addSearch('Yaoundé Bastos'); });
    const suggestions = result.current.getSuggestions('yaou');
    expect(suggestions.length).toBe(2);
    expect(suggestions.every((s: SearchHistoryItem) => s.query.toLowerCase().includes('yaou'))).toBe(true);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Kribi'); });
    const stored: SearchHistoryItem[] = JSON.parse(localStorage.getItem('keyhome_search_history') || '[]');
    expect(stored.some((s) => s.query === 'Kribi')).toBe(true);
  });

  it('ignores empty/whitespace-only searches', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch(''); });
    act(() => { result.current.addSearch('   '); });
    expect(result.current.history).toEqual([]);
  });

  it('ignores searches shorter than 2 characters', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('A'); });
    expect(result.current.history).toEqual([]);
  });

  it('returns all history when getSuggestions is called with empty string', () => {
    const { result } = renderHook(() => useSearchHistory());
    act(() => { result.current.addSearch('Yaoundé'); });
    act(() => { result.current.addSearch('Douala'); });
    const all = result.current.getSuggestions('');
    expect(all.length).toBe(2);
  });
});
