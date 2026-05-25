import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { formatConversationListTimestamp } from '@/lib/chat/conversation-list-time';

describe('formatConversationListTimestamp', () => {
  const NOW = new Date('2026-05-05T14:00:00+02:00');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns only HH:mm for the same calendar day', () => {
    const t = new Date('2026-05-05T09:37:00+02:00').toISOString();
    expect(formatConversationListTimestamp(t)).toMatch(/^\d{2}:\d{2}$/);
    expect(formatConversationListTimestamp(t)).toBe('09:37');
  });

  it('returns hier · HH:mm for yesterday', () => {
    const t = new Date('2026-05-04T22:15:00+02:00').toISOString();
    expect(formatConversationListTimestamp(t)).toBe('hier · 22:15');
  });

  it('returns dd/MM · HH:mm for another day this year', () => {
    const t = new Date('2026-03-12T08:00:00+01:00').toISOString();
    expect(formatConversationListTimestamp(t)).toBe('12/03 · 08:00');
  });

  it('returns dd/MM/yyyy · HH:mm for another year', () => {
    const t = new Date('2025-01-07T18:30:00+01:00').toISOString();
    expect(formatConversationListTimestamp(t)).toBe('07/01/2025 · 18:30');
  });

  it('returns empty string for invalid input', () => {
    expect(formatConversationListTimestamp('')).toBe('');
    expect(formatConversationListTimestamp('not-a-date')).toBe('');
  });
});
