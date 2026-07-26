'use client';

import { resolveChatAudioUrl } from '@/lib/chat/chat-attachment-audio';
import type { MessageAttachment } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { AlertTriangle, Loader2, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface VoicePlayerProps {
  attachment: MessageAttachment;
  isOwn: boolean;
  theme: ChatTheme;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Compact WhatsApp-style voice note player.
 *
 * - Tap-to-play with a circular play / pause button.
 * - Pre-computed waveform peaks render as bars; played portion fills with the
 *   bubble's foreground colour.
 * - Drag-to-scrub on the waveform updates the playhead in real time.
 * - Time label shows current/total mm:ss.
 * - Surfaces playback errors (signed_url expired, codec unsupported, CORS,
 *   network) instead of silently no-op'ing.
 *
 * The audio source is the signed_url from the API (refreshed on each fetch;
 * TTL matches server `chat.signed_url_ttl_hours`, default 24 h). The component
 * also listens to the audio element's own `error` event so an expired URL or
 * a transient network drop renders a retry affordance instead of a dead
 * button.
 */
export function VoicePlayer({ attachment, isOwn, theme }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioAbortRef = useRef<AbortController | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<PlayerState>('idle');
  const [position, setPosition] = useState(0);
  const initialTotalMs = attachment.audio_duration_ms ?? 0;
  const [durationMs, setDurationMs] = useState(initialTotalMs);
  const peaks = attachment.audio_waveform_peaks ?? [];
  const isPlaying = state === 'playing';
  const audioSrc = resolveChatAudioUrl(attachment);

  useEffect(() => {
    setDurationMs(initialTotalMs);
  }, [initialTotalMs, audioSrc]);

  // Stop / cleanup when the source changes or the component unmounts.
  useEffect(() => {
    return () => {
      audioAbortRef.current?.abort();
      audioAbortRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  const ensureAudio = useCallback((): HTMLAudioElement | null => {
    if (!audioSrc) {
      return null;
    }
    if (audioRef.current) {
      return audioRef.current;
    }
    const el = new Audio();
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.preload = 'auto';
    el.src = audioSrc;

    // Tie every listener to an AbortController so they are removed when the
    // source changes or the component unmounts (no dangling listeners).
    const abort = new AbortController();
    audioAbortRef.current = abort;
    const { signal } = abort;

    el.addEventListener(
      'loadedmetadata',
      () => {
        if (Number.isFinite(el.duration) && el.duration > 0) {
          setDurationMs(Math.round(el.duration * 1000));
        }
      },
      { signal }
    );
    el.addEventListener(
      'timeupdate',
      () => {
        setPosition(el.currentTime * 1000);
      },
      { signal }
    );
    el.addEventListener('playing', () => setState('playing'), { signal });
    el.addEventListener(
      'pause',
      () => setState((s) => (s === 'error' || s === 'loading' ? s : 'paused')),
      { signal }
    );
    el.addEventListener(
      'ended',
      () => {
        setState('paused');
        setPosition(0);
        el.currentTime = 0;
      },
      { signal }
    );
    el.addEventListener('error', () => setState('error'), { signal });

    audioRef.current = el;
    return el;
  }, [audioSrc]);

  const toggle = useCallback(() => {
    if (!audioSrc) {
      setState('error');
      return;
    }

    if (state === 'error') {
      audioAbortRef.current?.abort();
      audioAbortRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
      setState('idle');
    }

    const el = ensureAudio();
    if (!el) {
      setState('error');
      return;
    }

    if (state === 'playing') {
      el.pause();
      setState('paused');
      return;
    }

    setState('loading');
    try {
      el.load();
    } catch {
      /* ignore — some browsers throw if autoplay policy blocks load */
    }
    void el
      .play()
      .then(() => setState('playing'))
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[VoicePlayer] playback failed', err);
        }
        setState('error');
      });
  }, [ensureAudio, state, audioSrc]);

  const onTrackPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      const total = durationMs;
      if (!track || total <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (e.clientX - rect.left) / rect.width)
      );
      const ms = ratio * total;
      const el = ensureAudio();
      if (!el) {
        return;
      }
      el.currentTime = ms / 1000;
      setPosition(ms);
    },
    [durationMs, ensureAudio]
  );

  const progress = durationMs > 0 ? Math.min(1, position / durationMs) : 0;
  const fg = isOwn ? '#fff' : theme.accent;
  const bg = isOwn ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.10)';
  const totalSecs = Math.round(
    (isPlaying ? Math.max(0, durationMs - position) : durationMs) / 1000
  );
  const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const ss = String(totalSecs % 60).padStart(2, '0');

  const buttonLabel =
    state === 'loading'
      ? 'Chargement…'
      : state === 'error'
        ? 'Réessayer'
        : isPlaying
          ? 'Pause'
          : 'Lire le message vocal';

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ minWidth: 200, maxWidth: 260 }}
    >
      <button
        type="button"
        onClick={toggle}
        className="inline-flex shrink-0 items-center justify-center rounded-full border-0 p-0 outline-none transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          width: 44,
          height: 44,
          minWidth: 44,
          minHeight: 44,
          boxSizing: 'border-box',
          backgroundColor: isOwn
            ? 'rgba(255,255,255,0.22)'
            : theme.accentLighter,
          color: fg,
          outlineColor: fg,
        }}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        {state === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === 'error' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4" fill="currentColor" />
        )}
      </button>

      <div
        ref={trackRef}
        onPointerDown={(e) => {
          if (state === 'error') return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          onTrackPointer(e);
        }}
        onPointerMove={(e) => {
          if (state === 'error') return;
          if (e.buttons === 1) onTrackPointer(e);
        }}
        className="relative flex-1 flex items-center gap-[2px] cursor-pointer h-7 select-none"
        aria-disabled={state === 'error'}
      >
        {peaks.length > 0 ? (
          peaks.map((p, i) => {
            const filled = i / peaks.length <= progress;
            return (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 2,
                  height: `${Math.max(4, Math.round(p * 22))}px`,
                  backgroundColor: filled ? fg : bg,
                  transition: 'background-color 80ms linear',
                }}
              />
            );
          })
        ) : (
          // Fallback when no waveform was computed at upload time
          <div
            className="h-1 rounded-full w-full overflow-hidden"
            style={{ backgroundColor: bg }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: fg,
                transition: 'width 100ms linear',
              }}
            />
          </div>
        )}
      </div>

      <span
        className="shrink-0 tabular-nums text-[11px]"
        style={{
          color:
            state === 'error'
              ? '#ef4444'
              : isOwn
                ? 'rgba(255,255,255,0.85)'
                : theme.textMuted,
        }}
      >
        {state === 'error' ? 'Indispo' : `${mm}:${ss}`}
      </span>
    </div>
  );
}
