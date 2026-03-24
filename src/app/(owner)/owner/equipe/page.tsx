'use client';

import EmptyState from '@/components/ui/EmptyState';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { teamKeys } from '@/lib/query-keys';
import { useAuth } from '@/providers/AuthProvider';
import { ownerService, type TeamInvitation, type TeamMember } from '@/services/owner.service';
import { UserType } from '@/types';
import {
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function getInitials(firstname: string, lastname: string): string {
  return `${firstname[0] ?? ''}${lastname[0] ?? ''}`.toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  viewer: 'Lecteur',
  admin: 'Admin',
};

function RoleChip({ role }: { role: string }) {
  return (
    <Chip
      size="small"
      label={ROLE_LABELS[role] ?? role}
      color={role === 'manager' ? 'primary' : 'default'}
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

function formatExpiresAt(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function OwnerEquipePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ email: string; role: 'manager' | 'viewer' }>({
    email: '',
    role: 'viewer',
  });
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const isAgency = user?.type === UserType.AGENCY;

  // ─── Fetch Team ───
  const { data: teamData, isLoading, isError } = useQuery({
    queryKey: teamKeys.all,
    queryFn: () => ownerService.getTeam(),
  });

  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];

  // ─── Remove Member ───
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => ownerService.removeTeamMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      setSnackbar({ message: 'Membre retiré avec succès', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ message: 'Erreur lors du retrait du membre', severity: 'error' });
    },
  });

  // ─── Revoke Invitation ───
  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => ownerService.revokeTeamInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      setSnackbar({ message: 'Invitation révoquée', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ message: "Erreur lors de la révocation de l'invitation", severity: 'error' });
    },
  });

  // ─── Invite Member ───
  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: 'manager' | 'viewer' }) =>
      ownerService.inviteTeamMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'viewer' });
      setSnackbar({ message: 'Invitation envoyée avec succès', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ message: "Erreur lors de l'envoi de l'invitation", severity: 'error' });
    },
  });

  const handleInviteSubmit = () => {
    if (!inviteForm.email.trim()) {
      return;
    }
    inviteMutation.mutate(inviteForm);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/owner/dashboard' },
          { label: 'Mon équipe' },
        ]}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mon équipe
          </Typography>
          <Typography color="text.secondary">
            Gérez les membres de votre équipe et les invitations en attente.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Inviter un membre
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : isError ? (
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <EmptyState
            icon={<GroupIcon />}
            title="Impossible de charger l'équipe"
            description="Une erreur est survenue. Veuillez réessayer."
          />
        </Card>
      ) : (
        <>
          {/* ─── Members Section ─── */}
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <GroupIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" fontWeight={700}>
                  Membres
                </Typography>
                {members.length > 0 && (
                  <Chip size="small" label={members.length} sx={{ fontWeight: 700 }} />
                )}
              </Stack>

              {members.length === 0 ? (
                <EmptyState
                  title="Aucun membre pour l'instant"
                  description="Invitez des collaborateurs pour gérer vos biens ensemble."
                  size="sm"
                  action={{ label: 'Inviter un membre', onClick: () => setInviteOpen(true) }}
                />
              ) : (
                <List disablePadding>
                  {members.map((member: TeamMember, index: number) => (
                    <Box key={member.id}>
                      <ListItem
                        disablePadding
                        sx={{ py: 1, pr: isAgency ? 14 : 0 }}
                        secondaryAction={
                          isAgency ? (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              disabled={removeMemberMutation.isPending}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Retirer
                            </Button>
                          ) : undefined
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                            {getInitials(member.firstname, member.lastname)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography variant="body2" fontWeight={700}>
                                {member.firstname} {member.lastname}
                              </Typography>
                              <RoleChip role={member.role} />
                            </Stack>
                          }
                          secondary={member.email}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      {index < members.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* ─── Pending Invitations Section ─── */}
          {invitations.length > 0 && (
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <PersonAddIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Invitations en attente
                  </Typography>
                  <Chip size="small" label={invitations.length} sx={{ fontWeight: 700 }} />
                </Stack>

                <List disablePadding>
                  {invitations.map((invitation: TeamInvitation, index: number) => (
                    <Box key={invitation.id}>
                      <ListItem
                        disablePadding
                        sx={{ py: 1, pr: 14 }}
                        secondaryAction={
                          <Button
                            size="small"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                            disabled={revokeInvitationMutation.isPending}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Révoquer
                          </Button>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.300', color: 'text.secondary' }}>
                            {invitation.email[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography variant="body2" fontWeight={600}>
                                {invitation.email}
                              </Typography>
                              <RoleChip role={invitation.role} />
                            </Stack>
                          }
                          secondary={`Expire le ${formatExpiresAt(invitation.expires_at)}`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      {index < invitations.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── Invite Dialog ─── */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Inviter un membre</DialogTitle>
        <DialogContent>
          {!isAgency ? (
            <Alert severity="info" sx={{ borderRadius: 2, mt: 1 }}>
              Rejoignez ou créez une agence pour inviter des membres dans votre équipe.
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email *"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                disabled={inviteMutation.isPending}
                size="small"
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControl size="small">
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={inviteForm.role}
                  label="Rôle"
                  onChange={(e: SelectChangeEvent) =>
                    setInviteForm((f) => ({ ...f, role: e.target.value as 'manager' | 'viewer' }))
                  }
                  disabled={inviteMutation.isPending}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="viewer">Lecteur</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setInviteOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          {isAgency && (
            <Button
              variant="contained"
              onClick={handleInviteSubmit}
              disabled={!inviteForm.email.trim() || inviteMutation.isPending}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {inviteMutation.isPending ? 'Envoi...' : "Envoyer l'invitation"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
