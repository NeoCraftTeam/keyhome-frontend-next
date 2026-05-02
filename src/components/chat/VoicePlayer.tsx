'use client';

import type { MessageAttachment } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VoicePlayerProps {
  attachment: MessageAttachment;
  isOwn: boolean;
  theme: ChatTheme;
}

/**
 * Compact WhatsApp-style voice note player.
 *
 * - Tap-to-play with a circular play / pause button.
 * - Pre-computed waveform peaks render as bars; played portion fills with the
 *   bubble's foreground colour.
 * - Drag-to-scrub on the waveform updates the playhead in real time.
 * - Time label shows current/total mm:ss.
 *
 * The audio source is the signed_url from the API (refreshed on each fetch;
 * TTL matches server `chat.signed_url_ttl_hours`, default 24h).
 */
export function VoicePlayer({ attachment, isOwn, theme }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0); // ms
  const initialTotalMs = attachment.audio_duration_ms ?? 0;
  const [durationMs, setDurationMs] = useState(initialTotalMs);
  const peaks = attachment.audio_waveform_peaks ?? [];

  useEffect(() => {
    setDurationMs(initialTotalMs);
  }, [initialTotalMs, attachment.signed_url]);

  // Stop / cleanup when the source changes or the component unmounts.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [attachment.signed_url]);

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const el = new Audio(attachment.signed_url);
    el.preload = 'metadata';
    el.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDurationMs(Math.round(el.duration * 1000));
      }
    });
    el.addEventListener('timeupdate', () => {
      setPosition(el.currentTime * 1000);
    });
    el.addEventListener('ended', () => {
      setIsPlaying(false);
      setPosition(0);
      el.currentTime = 0;
    });
    audioRef.current = el;
    return el;
  };

  const toggle = () => {
    const el = ensureAudio();
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      void el
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => undefined);
    }
  };

  const onTrackPointer = (e: React.PointerEvent<HTMLDivElement>) => {
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
    el.currentTime = ms / 1000;
    setPosition(ms);
  };

  const progress = durationMs > 0 ? Math.min(1, position / durationMs) : 0;
  const fg = isOwn ? '#fff' : theme.accent;
  const bg = isOwn ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.10)';
  const totalSecs = Math.round(
    (isPlaying ? durationMs - position : durationMs) / 1000
  );
  const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const ss = String(totalSecs % 60).padStart(2, '0');

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ minWidth: 200, maxWidth: 260 }}
    >
      <button
        type="button"
        onClick={toggle}
        className="shrink-0 rounded-full p-2 transition-transform active:scale-95"
        style={{
          backgroundColor: isOwn
            ? 'rgba(255,255,255,0.22)'
            : theme.accentLighter,
          color: fg,
        }}
        aria-label={isPlaying ? 'Pause' : 'Lire le message vocal'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4" fill="currentColor" />
        )}
      </button>

      <div
        ref={trackRef}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          onTrackPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) onTrackPointer(e);
        }}
        className="relative flex-1 flex items-center gap-[2px] cursor-pointer h-7 select-none"
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
        style={{ color: isOwn ? 'rgba(255,255,255,0.85)' : theme.textMuted }}
      >
        {mm}:{ss}
      </span>
    </div>
  );
}
