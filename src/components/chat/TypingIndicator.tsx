'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';

interface TypingIndicatorProps {
  name: string;
  theme?: ChatTheme;
}

/**
 * WhatsApp-style typing indicator — animated dots inside a chat-bubble shape.
 */
export function TypingIndicator({
  name,
  theme = CLIENT_THEME,
}: TypingIndicatorProps) {
  return (
    <div className="flex items-end gap-2 ml-10 mt-1.5 mb-1">
      <div className="flex flex-col gap-1">
        <div
          className="flex items-center gap-[5px] px-4 py-3 rounded-[18px] rounded-bl-[6px]"
          style={{
            backgroundColor: theme.surfaceBg,
            boxShadow: theme.isDark
              ? `0 1px 4px rgba(0,0,0,0.25), 0 0 0 1px ${theme.glassBorder}`
              : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-[7px] w-[7px] rounded-full"
              style={{
                backgroundColor: theme.textMuted,
                animation: 'typingDot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <span
          className="text-[10.5px] px-1.5"
          style={{ color: theme.textMuted }}
        >
          {name} écrit…
        </span>
      </div>
      <style>{`@keyframes typingDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}`}</style>
    </div>
  );
}
