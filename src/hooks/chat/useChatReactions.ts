'use client';

/**
 * useChatReactions — optimistic reaction toggle with rollback.
 *
 * Owns:
 *  - Optimistic cache write (add/remove from reaction group)
 *  - POST /reactions or DELETE /reactions API call
 *  - Rollback on API failure
 */

import { addReaction, removeReaction } from '@/lib/chat/chat-api';
import type { MessagesCache } from '@/hooks/chat/useChatMessages';
import type { User } from '@/types/user';
import { useCallback } from 'react';

export function useChatReactions(
  user: User | null | undefined,
  updateCache: (updater: (old: MessagesCache) => MessagesCache) => void
): {
  toggleReaction: (messageUuid: string, emoji: string) => Promise<void>;
} {
  const toggleReaction = useCallback(
    async (messageUuid: string, emoji: string) => {
      if (!user) return;
      const userId = user.id;
      let wasSelected = false;

      // Optimistic write
      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) => {
          if (m.uuid !== messageUuid) return m;
          const groups = [...(m.reactions ?? [])];
          const idx = groups.findIndex((g) => g.emoji === emoji);
          if (idx >= 0 && groups[idx].user_ids.includes(userId)) {
            wasSelected = true;
            const group = groups[idx];
            const userIds = group.user_ids.filter((id) => id !== userId);
            if (userIds.length === 0) {
              groups.splice(idx, 1);
            } else {
              groups[idx] = {
                ...group,
                count: userIds.length,
                user_ids: userIds,
              };
            }
          } else if (idx >= 0) {
            groups[idx] = {
              ...groups[idx],
              count: groups[idx].count + 1,
              user_ids: [...groups[idx].user_ids, userId],
            };
          } else {
            groups.push({ emoji, count: 1, user_ids: [userId] });
          }
          return { ...m, reactions: groups };
        }),
      }));

      try {
        if (wasSelected) {
          await removeReaction(messageUuid, emoji);
        } else {
          await addReaction(messageUuid, emoji);
        }
      } catch {
        // Rollback: re-toggle to undo the optimistic write
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) => {
            if (m.uuid !== messageUuid) return m;
            const groups = [...(m.reactions ?? [])];
            const idx = groups.findIndex((g) => g.emoji === emoji);
            if (idx >= 0 && groups[idx].user_ids.includes(userId)) {
              const group = groups[idx];
              const userIds = group.user_ids.filter((id) => id !== userId);
              if (userIds.length === 0) groups.splice(idx, 1);
              else
                groups[idx] = {
                  ...group,
                  count: userIds.length,
                  user_ids: userIds,
                };
            } else if (idx >= 0) {
              groups[idx] = {
                ...groups[idx],
                count: groups[idx].count + 1,
                user_ids: [...groups[idx].user_ids, userId],
              };
            } else {
              groups.push({ emoji, count: 1, user_ids: [userId] });
            }
            return { ...m, reactions: groups };
          }),
        }));
      }
    },
    [user, updateCache]
  );

  return { toggleReaction };
}
