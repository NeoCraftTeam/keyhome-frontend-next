'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
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
 * Minimal peer-activity row — typing or voice recording (whispers on the conv channel).
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
  const barColor = isVoice ? '#ef4444' : theme.accent;

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
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            aria-hidden
            style={{
              backgroundColor: theme.isDark
                ? 'rgba(239,68,68,0.2)'
                : 'rgba(239,68,68,0.12)',
            }}
          >
            <span
              className="kh-rec-ring absolute inset-0 rounded-full border-2 border-red-500/40"
              style={{
                animation:
                  'khRecRing 1.5s cubic-bezier(0.22,1,0.36,1) infinite',
              }}
            />
            <Mic
              className="h-4 w-4 relative z-1"
              style={{ color: '#ef4444' }}
            />
          </span>
        ) : (
          <div
            className="flex items-end justify-center gap-0.5 h-4"
            aria-hidden
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="kh-typing-bar w-[3px] rounded-full origin-bottom"
                style={{
                  height: 14,
                  backgroundColor: barColor,
                  opacity: 0.85,
                  animation:
                    'khTypingBar 0.85s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
        <span
          className="text-[11px] font-medium leading-none tracking-wide"
          style={{
            color: theme.textSecondary,
            letterSpacing: '0.02em',
          }}
        >
          {caption}
        </span>
      </div>
      <style>{`
        @keyframes khTypingBar {
          0%, 100% { transform: scaleY(0.28); opacity: 0.35; }
          40% { transform: scaleY(1); opacity: 1; }
          70% { transform: scaleY(0.52); opacity: 0.65; }
        }
        @keyframes khRecRing {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.12); opacity: 0.15; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kh-typing-bar { animation: none !important; transform: scaleY(0.45); opacity: 0.5; }
          .kh-rec-ring { animation: none !important; opacity: 0.35; transform: none; }
        }
      `}</style>
    </div>
  );
}
