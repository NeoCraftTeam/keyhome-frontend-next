'use client';

import { fetchUnreadCount } from '@/lib/chat-api';
import { chatKeys } from '@/lib/query-keys';
import { useAuth } from '@/providers/AuthProvider';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Badge } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

/**
 * Chat icon with live unread-message badge.
 * Safe to use as a nav icon — internally fetches unread count every 60s.
 */
export function ChatBadgeIcon({
  badgeColor = 'error',
}: {
  /** Owner panel: use `primary` (teal) to match bailleur theme. */
  badgeColor?: 'primary' | 'error';
}) {
  const { isAuthenticated, user } = useAuth();

  const { data } = useQuery({
    queryKey: user ? chatKeys.unread(user.id) : chatKeys.unread(''),
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated && !!user,
    staleTime: 30_000,
    refetchInterval: 5 * 60_000,
  });

  // Show number of conversations with unread (WhatsApp-style), not total messages.
  const unreadConversations = data?.conversations?.length ?? 0;

  return (
    <Badge
      badgeContent={unreadConversations || null}
      color={badgeColor}
      max={99}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 },
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 24, color: 'inherit' }} />
    </Badge>
  );
}
