'use client';

import { useAuth } from '@/providers/AuthProvider';
import { conversationsService, MessageItem } from '@/services/conversations.service';
import { Ad } from '@/types';
import {
  ArrowBack,
  Chat,
  Close,
  Send,
  WhatsApp,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';

interface Props {
  ad: Ad;
  open: boolean;
  onClose: () => void;
}

export default function MessagingDrawer({ ad, open, onClose }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading: loadingConv } = useQuery({
    queryKey: ['conversation', ad.id],
    queryFn: () => conversationsService.findOrCreate(ad.id),
    enabled: open && isAuthenticated,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (conversation?.id) { setConversationId(conversation.id); }
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => conversationsService.sendMessage(conversationId!, body),
    onSuccess: (newMsg: MessageItem) => {
      queryClient.setQueryData(['conversation', ad.id], (old: typeof conversation) => {
        if (!old) { return old; }
        return { ...old, messages: [...old.messages, newMsg] };
      });
      setMessage('');
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !conversationId) { return; }
    sendMutation.mutate(trimmed);
  };

  const handleWhatsApp = () => {
    const phone = ad.user?.phone_number?.replace(/\D/g, '');
    if (!phone) { return; }
    const text = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${ad.title}" sur KeyHome.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const otherParty = conversation?.other_party;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 400 },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton onClick={onClose} size="small">
          <ArrowBack />
        </IconButton>
        {otherParty && (
          <Avatar src={otherParty.avatar ?? undefined} sx={{ width: 36, height: 36 }}>
            {otherParty.firstname?.[0]}
          </Avatar>
        )}
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} noWrap>
            {otherParty ? `${otherParty.firstname} ${otherParty.lastname}` : 'Propriétaire'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {ad.title}
          </Typography>
        </Box>
        {ad.user?.phone_is_whatsapp && ad.user?.phone_number && (
          <Tooltip title="Contacter sur WhatsApp">
            <IconButton onClick={handleWhatsApp} sx={{ color: '#25D366' }}>
              <WhatsApp />
            </IconButton>
          </Tooltip>
        )}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loadingConv ? (
          <Box display="flex" justifyContent="center" pt={4}>
            <CircularProgress />
          </Box>
        ) : conversation?.messages.length === 0 ? (
          <Box textAlign="center" pt={6}>
            <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              Commencez la conversation avec le propriétaire.
            </Typography>
          </Box>
        ) : (
          conversation?.messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    px: 2,
                    py: 1,
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    bgcolor: isMine ? 'primary.main' : 'action.hover',
                    color: isMine ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.body}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.25 }}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* WhatsApp bridge hint */}
      {ad.user?.phone_is_whatsapp && (
        <Box sx={{ px: 2, py: 1, bgcolor: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
          <Typography variant="caption" color="success.dark" display="flex" alignItems="center" gap={0.5}>
            <WhatsApp sx={{ fontSize: 14 }} />
            Ce propriétaire est joignable sur WhatsApp
          </Typography>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  color="primary"
                >
                  {sendMutation.isPending ? <CircularProgress size={20} /> : <Send />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>
    </Drawer>
  );
}
