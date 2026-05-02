'use client';

import { Plus } from 'lucide-react';
import type { ChatTheme } from './chat-theme';

const COMMON_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  isOwn: boolean;
  theme: ChatTheme;
  /** Emojis the current user has already reacted with — they appear filled. */
  selectedEmojis: Set<string>;
  /** Triggered when an emoji is tapped. Caller toggles add/remove. */
  onToggle: (emoji: string) => void;
  /** Optional more-emoji button. */
  onMore?: () => void;
}

/**
 * Compact emoji bar — appears above a message bubble after long-press.
 *
 * KeyHome style: glass background, accent-coloured selected ring, out-quint
 * pop-in. Six common emojis (heart, thumbs up, joy, wow, sad, pray) cover
 * 95 % of WhatsApp tap-back use cases without overwhelming the UI.
 */
export function ReactionPicker({
  isOwn,
  theme,
  selectedEmojis,
  onToggle,
  onMore,
}: ReactionPickerProps) {
  return (
    <div
      className={`absolute z-20 ${isOwn ? 'right-0' : 'left-0'} -top-12 flex items-center gap-1 rounded-full px-2 py-1.5`}
      style={{
        background: theme.isDark
          ? 'rgba(36,36,45,0.96)'
          : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(10px)',
        boxShadow: theme.isDark
          ? '0 6px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)'
          : '0 6px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        animation: 'reactionPickerIn 180ms cubic-bezier(0.22,1,0.36,1) both',
      }}
      role="toolbar"
      aria-label="Réagir au message"
    >
      <style>{`@keyframes reactionPickerIn{from{opacity:0;transform:translateY(6px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {COMMON_EMOJIS.map((emoji) => {
        const isSelected = selectedEmojis.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className="flex items-center justify-center rounded-full text-[18px] transition-transform active:scale-90 hover:scale-110"
            style={{
              width: 32,
              height: 32,
              backgroundColor: isSelected ? theme.accentLighter : 'transparent',
              boxShadow: isSelected ? `0 0 0 1.5px ${theme.accent}` : 'none',
            }}
            aria-label={`Réagir avec ${emoji}`}
            aria-pressed={isSelected}
          >
            {emoji}
          </button>
        );
      })}
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="flex items-center justify-center rounded-full transition-transform active:scale-90 hover:scale-110"
          style={{
            width: 32,
            height: 32,
            color: theme.textMuted,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.04)',
          }}
          aria-label="Plus d'emoji"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
