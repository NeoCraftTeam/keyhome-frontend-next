'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { semantic } from '@/theme/tokens';
import { Mic } from 'lucide-react';

interface TypingIndicatorProps {
  name: string;
  theme?: ChatTheme;
  /** Text activity vs voice note capture (whisper `voice_recording`). */
  variant?: 'typing' | 'recording';
}

function firstNameOnly(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];

  return part || fullName;
}

/**
 * Peer-activity row — typing or voice recording (whispers on the conv channel).
 * Dots use a soft opacity pulse only (no vertical scale/bounce).
 */
export function TypingIndicator({
  name,
  theme = CLIENT_THEME,
  variant = 'typing',
}: TypingIndicatorProps) {
  const displayName = firstNameOnly(name);
  const isVoice = variant === 'recording';
  const caption = isVoice
    ? `${displayName} enregistre…`
    : `${displayName} écrit…`;
  const label = isVoice
    ? `${displayName} enregistre un message vocal`
    : `${displayName} est en train d'écrire`;
  const recordingColor = semantic.errorBright;
  const barColor = isVoice ? recordingColor : theme.accent;

  return (
    <div
      className="flex items-center gap-3 ml-2 sm:ml-10 mt-0.5 mb-2 px-1"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2 backdrop-blur-md"
        style={{
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.72)',
          boxShadow: theme.isDark
            ? `inset 0 0 0 1px ${theme.glassBorder}, 0 2px 12px rgba(0,0,0,0.2)`
            : `inset 0 0 0 1px rgba(0,0,0,0.05), 0 2px 14px rgba(0,0,0,0.04)`,
        }}
      >
        {isVoice ? (
          <span
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full kh-voice-idle"
            aria-hidden
            style={{
              backgroundColor: theme.isDark
                ? `color-mix(in srgb, ${recordingColor} 22%, transparent)`
                : `color-mix(in srgb, ${recordingColor} 14%, transparent)`,
            }}
          >
            <Mic
              className="relative h-4 w-4 z-[1]"
              style={{ color: recordingColor }}
            />
          </span>
        ) : (
          <div className="flex items-center gap-1.5 h-4 px-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="kh-typing-dot h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: barColor,
                  animation:
                    'khTypingDotPulse 1.35s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        )}
        <span
          className="text-xs font-medium leading-snug tracking-wide"
          style={{
            color: theme.textSecondary,
            letterSpacing: '0.02em',
          }}
        >
          {caption}
        </span>
      </div>
      <style>{`
        @keyframes khTypingDotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes khVoiceIdle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        .kh-voice-idle {
          animation: khVoiceIdle 2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .kh-typing-dot { animation: none !important; opacity: 0.55; }
          .kh-voice-idle { animation: none !important; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
