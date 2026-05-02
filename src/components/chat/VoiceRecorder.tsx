'use client';

import type { MessageAttachment } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MAX_DURATION_MS = 120_000; // 2 minutes
const WAVEFORM_PEAKS = 40;

interface VoiceRecorderProps {
  onCancel: () => void;
  onReady: (attachment: MessageAttachment) => void;
  onUpload: (
    file: File,
    onProgress?: (pct: number) => void
  ) => Promise<MessageAttachment>;
  /** Broadcast to the other participant (Reverb client whisper). */
  onRecordingActiveChange?: (active: boolean) => void;
  theme: ChatTheme;
}

/**
 * In-input voice note recorder.
 *
 * Flow:
 *   1. User taps mic on the input bar → this component mounts.
 *   2. We request microphone permission and start MediaRecorder.
 *   3. While recording, we display elapsed time + a live volume bar.
 *   4. On stop, we:
 *        - decode the recording to compute waveform peaks (one float per band),
 *        - upload the resulting webm/m4a as an attachment,
 *        - hand the attachment back to the caller (with audio_* metadata)
 *          so it lands in the message compose row.
 *   5. The user can then add a caption / replyTo and tap Send like any other
 *      attachment, or cancel to discard.
 *
 * Browser support: MediaRecorder is available in all modern browsers including
 * iOS Safari 14.5+. We feature-detect and disable gracefully otherwise.
 */
export function VoiceRecorder({
  onCancel,
  onReady,
  onUpload,
  onRecordingActiveChange,
  theme,
}: VoiceRecorderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<
    'idle' | 'recording' | 'processing' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request mic + start on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (
          typeof window === 'undefined' ||
          typeof MediaRecorder === 'undefined'
        ) {
          throw new Error('Enregistrement vocal non disponible.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const mime = pickSupportedMime();
        const recorder = new MediaRecorder(
          stream,
          mime ? { mimeType: mime } : undefined
        );
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onerror = () => {
          setErrorMsg("Erreur d'enregistrement.");
          setPhase('error');
        };
        recorder.start();

        startedAtRef.current = Date.now();
        setPhase('recording');
        onRecordingActiveChange?.(true);

        tickerRef.current = setInterval(() => {
          const e = Date.now() - startedAtRef.current;
          setElapsed(e);
          if (e >= MAX_DURATION_MS) stopRecording();
        }, 200);
      } catch {
        if (!cancelled) {
          setErrorMsg('Microphone refusé ou indisponible.');
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      onRecordingActiveChange?.(false);
      if (tickerRef.current) clearInterval(tickerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== 'inactive'
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = () => {
    onRecordingActiveChange?.(false);
    if (tickerRef.current) clearInterval(tickerRef.current);
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'inactive') return;

    setPhase('processing');
    recorder.onstop = async () => {
      try {
        const mimeType = normalizeRecorderMime(recorder.mimeType);
        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });
        const duration = Math.min(
          MAX_DURATION_MS,
          Date.now() - startedAtRef.current
        );
        const peaks = await computePeaks(blob, WAVEFORM_PEAKS);

        const ext = extensionFromMime(mimeType);
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, {
          type: mimeType,
        });

        const attachment = await onUpload(file);
        const enriched: MessageAttachment = {
          ...attachment,
          type: 'audio',
          audio_duration_ms: duration,
          audio_waveform_peaks: peaks,
        };
        onReady(enriched);
      } catch {
        setErrorMsg("Échec de l'envoi du message vocal.");
        setPhase('error');
      } finally {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
    };
    recorder.stop();
  };

  const cancel = () => {
    onRecordingActiveChange?.(false);
    if (tickerRef.current) clearInterval(tickerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const r = mediaRecorderRef.current;
      if (r && r.state !== 'inactive') {
        r.onstop = null as unknown as () => void;
        r.stop();
      }
    } catch {
      /* noop */
    }
    onCancel();
  };

  const seconds = Math.floor(elapsed / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: theme.isDark
          ? 'rgba(255,255,255,0.04)'
          : theme.accentLighter,
        borderTop: `1px solid ${theme.glassBorder}`,
      }}
    >
      <button
        type="button"
        onClick={cancel}
        className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-black/5 transition-colors"
        aria-label="Annuler le message vocal"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      {phase === 'recording' && (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-full inline-block"
              style={{
                backgroundColor: '#ef4444',
                animation: 'recPulse 1s ease-in-out infinite',
              }}
            />
            <style>{`@keyframes recPulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
            <span
              className="text-[13px] font-medium tabular-nums"
              style={{ color: theme.textPrimary }}
            >
              {mm}:{ss}
            </span>
            <span className="text-[12px]" style={{ color: theme.textMuted }}>
              · Glissez pour annuler — relâchez pour envoyer
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="shrink-0 rounded-full p-2.5 text-white transition-all active:scale-95"
            style={{
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
              boxShadow: `0 2px 10px ${theme.accent}40`,
            }}
            aria-label="Arrêter et envoyer"
          >
            <Square className="h-[18px] w-[18px]" fill="currentColor" />
          </button>
        </>
      )}

      {phase === 'processing' && (
        <span className="text-[13px]" style={{ color: theme.textMuted }}>
          Préparation du message vocal…
        </span>
      )}

      {phase === 'error' && (
        <>
          <span className="flex-1 text-[13px] text-red-500">
            {errorMsg ?? "Échec de l'enregistrement."}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-gray-500"
            aria-label="Fermer"
          >
            <Mic className="h-5 w-5" />
          </button>
        </>
      )}

      {phase === 'idle' && (
        <span className="text-[13px]" style={{ color: theme.textMuted }}>
          Demande d&apos;accès au microphone…
        </span>
      )}

      {/* Quick send — visible only during recording, mirrors the stop button
          for users who like the explicit "send" affordance. */}
      {phase === 'recording' && (
        <button
          type="button"
          onClick={stopRecording}
          className="hidden md:inline-flex rounded-full p-2.5 text-white transition-all active:scale-95"
          style={{
            background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
          }}
          aria-label="Envoyer le message vocal"
        >
          <Send className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}

/** Strip codec params so Blob/File `type` is valid (e.g. audio/webm not audio/webm;codecs=opus). */
function normalizeRecorderMime(mime: string | undefined): string {
  const raw = mime || 'audio/webm';
  return raw.split(';')[0]?.trim().toLowerCase() || 'audio/webm';
}

function extensionFromMime(mime: string): string {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? 'audio/webm';
  if (base === 'audio/mp4' || base === 'video/mp4') {
    return 'mp4';
  }
  const sub = base.split('/')[1] ?? 'webm';

  return sub.replace(/[^a-z0-9]/g, '') || 'webm';
}

/** Prefer MP4/AAC first so recipients on Safari can play Chrome-origin notes when supported. */
function pickSupportedMime(): string | null {
  const candidates = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const m of candidates) {
    if (
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported &&
      MediaRecorder.isTypeSupported(m)
    ) {
      return m;
    }
  }
  return null;
}

/**
 * Decode a recorded blob and reduce its samples to N normalised peaks (0..1)
 * that the receiver can render as a waveform without re-decoding.
 */
async function computePeaks(blob: Blob, peakCount: number): Promise<number[]> {
  try {
    const buffer = await blob.arrayBuffer();
    const Ctx =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        : null;
    if (!Ctx) return Array(peakCount).fill(0.5);
    const ctx = new Ctx();
    const audio = await ctx.decodeAudioData(buffer.slice(0));
    const channel = audio.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channel.length / peakCount));
    const peaks: number[] = [];
    for (let i = 0; i < peakCount; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channel.length);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channel[j]);
        if (v > max) max = v;
      }
      peaks.push(Math.min(1, max));
    }
    void ctx.close().catch(() => undefined);
    // Normalise so the loudest peak is 1.0 — keeps the waveform readable
    // even on quiet recordings.
    const peak = Math.max(...peaks, 0.01);
    return peaks.map((p) => p / peak);
  } catch {
    return Array(peakCount).fill(0.5);
  }
}
