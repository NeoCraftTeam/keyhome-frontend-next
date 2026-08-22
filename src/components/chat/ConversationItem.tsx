'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import type { Conversation } from '@/types/chat';
import {
  prefetchChatMessages,
  chatMessagesKey,
  type MessagesCache,
} from '@/hooks/useChat';
import { useChatMessagesCacheEntry } from '@/hooks/useChatMessagesCacheEntry';
import { mergeConversationLastMessage } from '@/lib/chat/conversation-list-preview';
import { decryptSealedTextForListPreview } from '@/lib/chat/conversation-list-sealed-decrypt';
import type { ConversationsListQueryData } from '@/lib/chat/conversation-list-cache';
import { chatKeys } from '@/lib/query-keys';
import { formatConversationListTimestamp } from '@/lib/chat/conversation-list-time';
import { CHAT_E2EE_READY_EVENT } from '@/lib/chat/chat-e2ee-identity';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { StatusIcon } from './MessageBubble';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  basePath?: string;
  theme?: ChatTheme;
  /** True when the other participant is currently typing in this conversation. */
  isTyping?: boolean;
}

export function ConversationItem({
  conversation,
  isActive,
  basePath = '/messages',
  theme = CLIENT_THEME,
  isTyping = false,
}: ConversationItemProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const [e2eeListDecryptTick, setE2eeListDecryptTick] = useState(0);
  const participant = conversation.other_participant;

  const messagesCache = useChatMessagesCacheEntry(user?.id, conversation.uuid);
  const mergedLast = useMemo(
    () =>
      mergeConversationLastMessage(conversation.last_message, messagesCache),
    [conversation.last_message, messagesCache]
  );

  useEffect(() => {
    const onReady = (): void => setE2eeListDecryptTick((n) => n + 1);
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener(CHAT_E2EE_READY_EVENT, onReady);
    return () => window.removeEventListener(CHAT_E2EE_READY_EVENT, onReady);
  }, []);

  useEffect(() => {
    const msg = mergedLast;
    if (msg == null || msg.is_client_sealed !== true) {
      return;
    }
    const seal = msg.e2ee;
    if (seal == null) {
      return;
    }
    if (
      (msg.decrypted_body != null && msg.decrypted_body !== '') ||
      msg.decryption_failed === true
    ) {
      return;
    }
    if (user?.id == null) {
      return;
    }
    const meta = conversation.e2ee;
    const wrappedB64 = meta?.wrapped_conversation_key_b64;
    if (
      meta?.session_ready !== true ||
      wrappedB64 == null ||
      wrappedB64 === ''
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const outcome = await decryptSealedTextForListPreview(
        user.id,
        conversation.uuid,
        wrappedB64,
        seal.ciphertext_b64,
        seal.iv_b64
      );
      if (cancelled) {
        return;
      }
      if (outcome.kind === 'pending') {
        return;
      }
      if (outcome.kind === 'failed') {
        queryClient.setQueryData<ConversationsListQueryData>(
          chatKeys.conversations(user.id),
          (old) => {
            if (old == null) {
              return old;
            }
            let changed = false;
            const data = old.data.map((c) => {
              if (c.uuid !== conversation.uuid) {
                return c;
              }
              const lm = c.last_message;
              if (lm == null || lm.uuid !== msg.uuid) {
                return c;
              }
              changed = true;
              return {
                ...c,
                last_message: { ...lm, decryption_failed: true },
              };
            });
            return changed ? { ...old, data } : old;
          }
        );
        return;
      }

      const plain = outcome.text;
      const snippet = plain.slice(0, 80);
      queryClient.setQueryData<ConversationsListQueryData>(
        chatKeys.conversations(user.id),
        (old) => {
          if (old == null) {
            return old;
          }
          let changed = false;
          const data = old.data.map((c) => {
            if (c.uuid !== conversation.uuid) {
              return c;
            }
            const lm = c.last_message;
            if (lm == null || lm.uuid !== msg.uuid) {
              return c;
            }
            changed = true;
            return {
              ...c,
              last_message: {
                ...lm,
                decrypted_body: plain,
                body: snippet,
                decryption_failed: false,
              },
            };
          });
          return changed ? { ...old, data } : old;
        }
      );

      const mk = chatMessagesKey(user.id, conversation.uuid);
      const existing = queryClient.getQueryData<MessagesCache>(mk);
      if (existing != null) {
        queryClient.setQueryData<MessagesCache>(mk, {
          ...existing,
          messages: existing.messages.map((m) =>
            m.uuid === msg.uuid
              ? { ...m, decrypted_body: plain, decryption_failed: false }
              : m
          ),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    mergedLast?.uuid,
    mergedLast?.is_client_sealed,
    mergedLast?.e2ee?.ciphertext_b64,
    mergedLast?.e2ee?.iv_b64,
    mergedLast?.decrypted_body,
    mergedLast?.decryption_failed,
    conversation.uuid,
    conversation.e2ee?.session_ready,
    conversation.e2ee?.wrapped_conversation_key_b64,
    user?.id,
    queryClient,
    e2eeListDecryptTick,
  ]);

  useEffect(() => {
    prefetchedRef.current = false;
  }, [user?.id]);
  const unread = conversation.unread_count > 0;
  const lastMsg = mergedLast;

  const timeLabel = conversation.last_message_at
    ? formatConversationListTimestamp(conversation.last_message_at)
    : '';

  const isOwnLastMsg = !!lastMsg?.sender_id && lastMsg.sender_id === user?.id;
  const plainPreview =
    lastMsg?.decrypted_body?.trim() ||
    (lastMsg?.is_client_sealed !== true ? lastMsg?.body?.trim() : '');
  let rawPreview: string | null = null;
  if (lastMsg) {
    if (plainPreview) {
      rawPreview = plainPreview.slice(0, 52);
    } else if (lastMsg.type === 'image') {
      rawPreview = '📷 Photo';
    } else if (lastMsg.type === 'audio') {
      rawPreview = '🎙 Message vocal';
    } else if (lastMsg.type === 'file') {
      rawPreview = '📎 Document';
    } else if (lastMsg.is_client_sealed === true) {
      // Historic sealed messages from a device we no longer have the key for
      // (E2EE off by default since mai 2026 — see AGENTS.md).
      rawPreview = 'Message d’un ancien appareil';
    }
  }
  const preview = rawPreview ?? 'Démarrez la conversation';

  const initial = participant?.name?.charAt(0).toUpperCase() ?? '?';

  const href = `${basePath}/${conversation.uuid}`;

  const warmCache = useCallback(() => {
    // Warm the Next route segment (RSC) so the thread pane paints instantly on
    // arrival. `router.prefetch` is deduped internally, so it's safe on repeat.
    router.prefetch(href);
    // Warm the message-query cache once so the thread already has data.
    if (prefetchedRef.current || !user?.id) return;
    prefetchedRef.current = true;
    prefetchChatMessages(queryClient, user.id, conversation.uuid);
  }, [router, href, queryClient, conversation.uuid, user]);

  const navigate = useCallback(() => {
    // `scroll: false` keeps the persistent shell anchored — only the thread
    // pane swaps, no scroll-to-top flash on navigation.
    router.push(href, { scroll: false });
  }, [router, href]);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => e.key === 'Enter' && navigate()}
      onMouseEnter={warmCache}
      onTouchStart={warmCache}
      className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-all duration-150 relative group active:scale-[0.985]"
      style={{
        backgroundColor: isActive ? theme.activeBg : undefined,
        borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5'}`,
      }}
    >
      {/* Active accent bar */}
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ backgroundColor: theme.accent }}
        />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        {participant?.avatar ? (
          <Image
            src={participant.avatar}
            alt={participant.name}
            width={48}
            height={48}
            className="rounded-full object-cover shadow-sm"
            style={{
              boxShadow: isActive
                ? `0 0 0 2px ${theme.accent}30`
                : '0 0 0 2px rgba(0,0,0,0.04)',
            }}
          />
        ) : (
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + timestamp */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={`text-[13.5px] truncate leading-tight ${unread ? 'font-semibold' : 'font-medium'}`}
            style={{ color: unread ? theme.textPrimary : theme.textSecondary }}
          >
            {participant?.name ?? 'Utilisateur'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.status === 'archived' && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#fef3c7',
                  color: '#92400e',
                }}
              >
                Archivé
              </span>
            )}
            <span
              className="text-[11px] shrink-0 tabular-nums"
              style={{
                color: unread ? theme.accent : theme.textMuted,
                fontWeight: unread ? 600 : 400,
              }}
            >
              {timeLabel}
            </span>
          </div>
        </div>

        {/* Row 2: tick + preview / typing + unread badge */}
        <div className="flex items-center justify-between gap-1.5">
          {isTyping ? (
            <span
              className="text-[12.5px] font-medium flex items-center gap-1"
              style={{ color: theme.accent }}
            >
              est en train d&apos;écrire
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="kh-list-typing-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: theme.accent,
                      animation:
                        'khListTypingPulse 1.35s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </span>
              <style>{`@keyframes khListTypingPulse{0%,100%{opacity:.3}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.kh-list-typing-dot{animation:none!important;opacity:.55}}`}</style>
            </span>
          ) : (
            <span className="flex items-center gap-1 min-w-0">
              {/* Own-message read receipt ticks */}
              {isOwnLastMsg && lastMsg?.status && (
                <span className="shrink-0 flex items-center translate-y-[0.5px]">
                  <StatusIcon status={lastMsg.status} theme={theme} />
                </span>
              )}

              <p
                className={`text-[12.5px] truncate leading-relaxed ${unread ? 'font-medium' : ''}`}
                style={{
                  color: unread ? theme.textSecondary : theme.textMuted,
                }}
              >
                {isOwnLastMsg ? `Vous : ${preview}` : preview}
              </p>
            </span>
          )}

          {unread && !isTyping && (
            <span
              className="shrink-0 rounded-full px-[7px] py-[2px] text-[10px] font-bold text-white min-w-[20px] text-center"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 1px 4px ${theme.accent}40`,
              }}
            >
              {conversation.unread_count > 99
                ? '99+'
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>

      {/* Hover highlight overlay */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none rounded-sm"
        style={{
          backgroundColor: isActive
            ? 'transparent'
            : theme.isDark
              ? 'rgba(255,255,255,0.055)'
              : 'rgba(0,0,0,0.038)',
        }}
      />
    </div>
  );
}
