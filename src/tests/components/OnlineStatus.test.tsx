/**
 * Unit test for the formatLastSeenShort helper used by OnlineStatus.
 *
 * Locks down French formatting for the chat header "Vu …" line.
 */
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { formatLastSeenShort } from '@/components/chat/OnlineStatus';

describe('formatLastSeenShort', () => {
  const NOW = new Date('2026-05-01T18:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "à l\'instant" for < 1 minute', () => {
    const seenAt = new Date(NOW.getTime() - 30_000).toISOString();
    expect(formatLastSeenShort(seenAt)).toBe("à l'instant");
  });

  it('returns "il y a N min" for < 60 minutes', () => {
    const seenAt = new Date(NOW.getTime() - 12 * 60_000).toISOString();
    expect(formatLastSeenShort(seenAt)).toBe('il y a 12 min');
  });

  it('returns "auj. à HH:mm" for same calendar day (after 60 min)', () => {
    const seenAt = new Date(NOW.getTime() - 2 * 60 * 60_000).toISOString();
    const result = formatLastSeenShort(seenAt);
    expect(result).toMatch(/^auj\. à \d{2}:\d{2}$/);
  });

  it('returns "hier à HH:mm" for the previous calendar day', () => {
    const seenAt = new Date(NOW.getTime() - 26 * 60 * 60_000).toISOString();
    const result = formatLastSeenShort(seenAt);
    expect(result).toMatch(/^hier à \d{2}:\d{2}$/);
  });

  it('returns "il y a N jours à HH:mm" for 2–6 calendar days', () => {
    const seenAt = new Date(NOW.getTime() - 3 * 24 * 60 * 60_000).toISOString();
    const result = formatLastSeenShort(seenAt);
    expect(result).toMatch(/^il y a 3 jours à \d{2}:\d{2}$/);
  });

  it('returns "le dd/MM/yyyy à HH:mm" for a week or more', () => {
    const seenAt = new Date(
      NOW.getTime() - 14 * 24 * 60 * 60_000
    ).toISOString();
    const result = formatLastSeenShort(seenAt);
    expect(result).toMatch(/^le \d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}$/);
  });
});
