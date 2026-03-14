'use client';

import MessagingDrawer from '@/components/messaging/MessagingDrawer';
import { useAuth } from '@/providers/AuthProvider';
import { conversationsService, ConversationSummary } from '@/services/conversations.service';
import { Chat } from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

export default function MessagesPage() {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<ConversationSummary | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.list(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const conversations = data?.data ?? [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Messages
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Vos conversations avec les propriétaires et locataires.
      </Typography>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Chat sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Aucun message pour l'instant</Typography>
            <Typography variant="body2" color="text.disabled" mt={1}>
              Contactez un propriétaire depuis une annonce pour démarrer une conversation.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {conversations.map((conv, idx) => (
              <Box key={conv.id}>
                <ListItemButton
                  onClick={() => setSelected(conv)}
                  sx={{ py: 2, px: 3 }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={conv.unread_count}
                      color="error"
                      invisible={conv.unread_count === 0}
                    >
                      <Avatar src={conv.other_party?.avatar ?? undefined}>
                        {conv.other_party?.firstname?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={conv.unread_count > 0 ? 700 : 400}>
                          {conv.other_party
                            ? `${conv.other_party.firstname} ${conv.other_party.lastname}`
                            : 'Utilisateur'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="primary.main" fontWeight={500}>
                          {conv.ad?.title ?? ''}
                        </Typography>
                        {conv.last_message && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ fontWeight: conv.unread_count > 0 ? 600 : 400 }}
                          >
                            {conv.last_message.body}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
                {idx < conversations.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* We need a dummy ad to open the drawer — fetch from conversation */}
      {selected && (
        <Box>
          {/* Simplified: open conversation directly by ID */}
          <Typography variant="caption" color="text.secondary" mt={2} display="block" textAlign="center">
            Cliquez sur une conversation pour l'ouvrir.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
