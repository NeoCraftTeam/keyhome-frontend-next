'use client';

import OpenDisputeDialog from '@/components/disputes/OpenDisputeDialog';
import FadeIn from '@/components/ui/layout/FadeIn';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import { useAuth } from '@/providers/AuthProvider';
import { disputesService } from '@/services/disputes.service';
import type { Dispute, DisputeStatus } from '@/types';
import AccessTime from '@mui/icons-material/AccessTime';
import Add from '@mui/icons-material/Add';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import Gavel from '@mui/icons-material/Gavel';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import RateReview from '@mui/icons-material/RateReview';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  DisputeStatus,
  {
    label: string;
    color: 'success' | 'error' | 'warning' | 'default' | 'info';
    icon: React.ReactElement;
  }
> = {
  open: {
    label: 'Ouvert',
    color: 'info',
    icon: <AccessTime sx={{ fontSize: 14 }} />,
  },
  under_review: {
    label: 'En examen',
    color: 'warning',
    icon: <HourglassEmpty sx={{ fontSize: 14 }} />,
  },
  mediation: {
    label: 'Médiation',
    color: 'warning',
    icon: <RateReview sx={{ fontSize: 14 }} />,
  },
  resolved_initiator: {
    label: 'Résolu (vous)',
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
  },
  resolved_respondent: {
    label: 'Résolu (autre)',
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
  },
  resolved_amicably: {
    label: "Résolu à l'amiable",
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
  },
  rejected: {
    label: 'Rejeté',
    color: 'error',
    icon: <ErrorOutline sx={{ fontSize: 14 }} />,
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LitigesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; ok: boolean } | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ['disputes', page, filter],
    queryFn: () =>
      disputesService.list({
        page,
        open_only: filter === 'open' ? true : undefined,
      }),
    staleTime: 60_000,
  });

  const disputes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Accueil', href: '/home' },
            { label: 'Mes litiges' },
          ]}
        />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Mes litiges
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            Gérez vos litiges et suivez leur résolution.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Nouveau litige
          </Button>
        </Stack>

        {/* Filter */}
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => {
            if (v) {
              setFilter(v);
              setPage(1);
            }
          }}
          size="small"
          sx={{ mb: 3 }}
        >
          <ToggleButton
            value="all"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Tous
          </ToggleButton>
          <ToggleButton
            value="open"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            En cours
          </ToggleButton>
        </ToggleButtonGroup>
      </FadeIn>

      {/* List */}
      {isLoading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={100}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      ) : disputes.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: { xs: 4, md: 6 },
            textAlign: 'center',
          }}
        >
          <Gavel sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun litige
          </Typography>
          <Typography color="text.secondary">
            Vous n&apos;avez pas encore de litige enregistré.
          </Typography>
        </Card>
      ) : (
        <>
          <Stack spacing={1.5}>
            {disputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                currentUserId={user?.id}
                onClick={() => router.push(`/litiges/${dispute.id}`)}
              />
            ))}
          </Stack>
          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      <OpenDisputeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => {
          setSnackbar({ msg: 'Litige ouvert avec succès.', ok: true });
          queryClient.invalidateQueries({ queryKey: ['disputes'] });
          router.push(`/litiges/${id}`);
        }}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.ok ? 'success' : 'error'}
          onClose={() => setSnackbar(null)}
          variant="filled"
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  DisputeCard                                                        */
/* ------------------------------------------------------------------ */

function DisputeCard({
  dispute,
  currentUserId,
  onClick,
}: {
  dispute: Dispute;
  currentUserId?: string;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.open;
  const isInitiator = dispute.initiator.id === currentUserId;

  return (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ py: '14px !important', px: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography fontWeight={700} sx={{ fontSize: 15 }}>
                  {dispute.title}
                </Typography>
                <Chip
                  label={dispute.type_label}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
                />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
                noWrap
              >
                {dispute.reference} · {isInitiator ? 'contre' : 'de'}{' '}
                {isInitiator ? dispute.respondent.name : dispute.initiator.name}
              </Typography>
              {dispute.amount_claimed != null && dispute.amount_claimed > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Montant réclamé :{' '}
                  {dispute.amount_claimed.toLocaleString('fr-FR')} FCFA
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mt: 0.25 }}
              >
                {new Date(dispute.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Typography>
            </Box>
            <Chip
              icon={cfg.icon}
              label={cfg.label}
              color={cfg.color}
              size="small"
              sx={{ fontWeight: 700, flexShrink: 0 }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
