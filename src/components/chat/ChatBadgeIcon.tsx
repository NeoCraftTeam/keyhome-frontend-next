'use client';

import { fetchUnreadCount } from '@/lib/chat-api';
import { useAuth } from '@/providers/AuthProvider';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Badge } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

/**
 * Chat icon with live unread-message badge.
 * Safe to use as a nav icon — internally fetches unread count every 60s.
 */
export function ChatBadgeIcon() {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 5 * 60_000,
  });

  // Show number of conversations with unread (WhatsApp-style), not total messages.
  const unreadConversations = data?.conversations?.length ?? 0;

  return (
    <Badge
      badgeContent={unreadConversations || null}
      color="error"
      max={99}
      sx={{
        '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 },
      }}
    >
      <ChatBubbleOutlineIcon />
    </Badge>
  );
}
