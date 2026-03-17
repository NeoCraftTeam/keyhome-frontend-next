'use client';

import { useCallback } from 'react';

type SoundType = 'favorite' | 'unfavorite' | 'success' | 'unlock' | 'notification';

const SOUND_ENABLED_KEY = 'keyhome_sound_enabled';

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return false;
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
): void {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    oscillator.onended = () => ctx.close();
  } catch {
    // AudioContext may be blocked or unsupported
  }
}

function playSequence(notes: Array<{ freq: number; delay: number; duration: number; volume?: number }>): void {
  if (!isSoundEnabled()) {
    return;
  }
  notes.forEach(({ freq, delay, duration, volume }) => {
    setTimeout(() => playTone(freq, duration, 'sine', volume ?? 0.07), delay);
  });
}

/**
 * Provides subtle, optional sound feedback for key interactions.
 * Respects the user's sound preference stored in localStorage.
 */
export function useSoundFeedback() {
  const play = useCallback((type: SoundType) => {
    if (!isSoundEnabled()) {
      return;
    }

    switch (type) {
      case 'favorite':
        // Two ascending notes — a satisfying "save" sound
        playSequence([
          { freq: 600, delay: 0, duration: 0.08 },
          { freq: 880, delay: 90, duration: 0.12 },
        ]);
        break;

      case 'unfavorite':
        // Two descending notes
        playSequence([
          { freq: 700, delay: 0, duration: 0.08 },
          { freq: 450, delay: 80, duration: 0.1 },
        ]);
        break;

      case 'success':
        // Three ascending notes — confirmation
        playSequence([
          { freq: 523, delay: 0, duration: 0.1 },
          { freq: 659, delay: 100, duration: 0.1 },
          { freq: 784, delay: 200, duration: 0.15 },
        ]);
        break;

      case 'unlock':
        // Sparkle-like ascending arpeggio
        playSequence([
          { freq: 523, delay: 0, duration: 0.08 },
          { freq: 659, delay: 80, duration: 0.08 },
          { freq: 784, delay: 160, duration: 0.08 },
          { freq: 1047, delay: 240, duration: 0.18, volume: 0.1 },
        ]);
        break;

      case 'notification':
        // Soft two-tone notification
        playSequence([
          { freq: 800, delay: 0, duration: 0.1, volume: 0.06 },
          { freq: 1000, delay: 110, duration: 0.12, volume: 0.06 },
        ]);
        break;
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch {
      // Ignore
    }
  }, []);

  const getSoundEnabled = useCallback((): boolean => isSoundEnabled(), []);

  return { play, setSoundEnabled, getSoundEnabled };
}

export { SOUND_ENABLED_KEY };
