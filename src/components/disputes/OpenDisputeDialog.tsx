'use client';

/**
 * OpenDisputeDialog
 * ─────────────────────────────────────────────────────────────
 * Context-driven, multi-step wizard to open a dispute — modeled
 * after PayPal/Airbnb's "Resolution Center" flow:
 *
 *   1) Pick a context: ad | conversation | other (rare fallback)
 *   2) Pick the specific item (ad search, conversation list)
 *   3) Choose type + title + description
 *
 * The respondent is auto-derived server-side from the context
 * (ad.user_id, lease.tenant/landlord, payment.user_id), so users
 * NEVER need to know the other party's UUID.
 *
 * Props let callers pre-seed the context (e.g. "Signaler" button on
 * an ad detail page → skips steps 1 and 2).
 */

import { fetchConversations } from '@/lib/chat-api';
import { disputesService } from '@/services/disputes.service';
import { unlockedAdsService } from '@/services/users.service';
import type {
  Ad,
  Conversation,
  CreateDisputePayload,
  DisputeType,
} from '@/types';
import Apartment from '@mui/icons-material/Apartment';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import CheckCircle from '@mui/icons-material/CheckCircle';
import HelpOutline from '@mui/icons-material/HelpOutline';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DisputeContext =
  | { kind: 'ad'; ad: Ad }
  | { kind: 'conversation'; conversation: Conversation };

interface OpenDisputeDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-seed the context — caller already knows it (skips step 1+2). */
  initialContext?: DisputeContext | null;
  /** Called after creation with the new dispute id. */
  onCreated?: (disputeId: string) => void;
}

const DISPUTE_TYPE_OPTIONS: { value: DisputeType; label: string }[] = [
  { value: 'deposit', label: 'Caution / dépôt de garantie' },
  { value: 'repair', label: 'Réparations / habitabilité' },
  { value: 'lease_termination', label: 'Résiliation du bail' },
  { value: 'payment', label: 'Paiement / impayé' },
  { value: 'access_refused', label: 'Accès au logement refusé' },
  { value: 'misrepresentation', label: 'Annonce non conforme' },
  { value: 'other', label: 'Autre' },
];

type Step = 'context' | 'pick' | 'form';
type ContextKind = 'ad' | 'conversation';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OpenDisputeDialog({
  open,
  onClose,
  initialContext,
  onCreated,
}: OpenDisputeDialogProps) {
  const [step, setStep] = useState<Step>('context');
  const [contextKind, setContextKind] = useState<ContextKind | null>(null);
  const [context, setContext] = useState<DisputeContext | null>(null);

  const [type, setType] = useState<DisputeType>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [titleDirty, setTitleDirty] = useState(false);
  const [descDirty, setDescDirty] = useState(false);

  // Reset / seed when opened
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initialContext) {
      setContext(initialContext);
      setContextKind(initialContext.kind);
      setStep('form');
    } else {
      setContext(null);
      setContextKind(null);
      setStep('context');
      setType('other');
      setTitle('');
      setDescription('');
      setAmount('');
    }
    setTitleDirty(false);
    setDescDirty(false);
  }, [open, initialContext]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateDisputePayload) =>
      disputesService.create(payload),
    onSuccess: (dispute) => {
      onCreated?.(dispute.id);
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
    },
  });

  const buildPayload = (): CreateDisputePayload | null => {
    if (!context) return null;
    const base: CreateDisputePayload = {
      type,
      title: title.trim(),
      description: description.trim(),
      amount_claimed: amount ? parseInt(amount, 10) : undefined,
    };
    if (context.kind === 'ad') {
      return { ...base, ad_id: context.ad.id };
    }
    if (context.kind === 'conversation') {
      return {
        ...base,
        ad_id: context.conversation.ad?.id ?? undefined,
        respondent_id: context.conversation.other_participant?.id,
      };
    }
    return base;
  };

  const handleSubmit = () => {
    setTitleDirty(true);
    setDescDirty(true);
    setError(null);
    if (title.trim().length < 5) {
      setError('Le titre doit comporter au moins 5 caractères.');
      return;
    }
    if (description.trim().length < 20) {
      setError(
        `La description doit comporter au moins 20 caractères (${description.trim().length}/20).`
      );
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      setError('Contexte manquant.');
      return;
    }
    createMutation.mutate(payload);
  };

  const goBack = () => {
    setError(null);
    if (step === 'form') {
      // If the dialog was seeded from outside, closing is the only escape.
      if (initialContext) {
        onClose();
        return;
      }
      setStep('pick');
    } else if (step === 'pick') {
      setContextKind(null);
      setContext(null);
      setStep('context');
    }
  };

  const titleByStep: Record<Step, string> = {
    context: 'Sur quoi porte votre litige ?',
    pick:
      contextKind === 'ad'
        ? 'Sélectionner une annonce'
        : 'Sélectionner une conversation',
    form: 'Détails du litige',
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {step !== 'context' && !initialContext && (
          <IconButton size="small" onClick={goBack} aria-label="Retour">
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        {titleByStep[step]}
      </DialogTitle>

      <DialogContent dividers>
        {step === 'context' && (
          <ContextStep
            onPick={(kind) => {
              setContextKind(kind);
              setStep('pick');
            }}
          />
        )}

        {step === 'pick' && contextKind === 'ad' && (
          <AdPickerStep
            onPick={(ad) => {
              setContext({ kind: 'ad', ad });
              setStep('form');
            }}
          />
        )}

        {step === 'pick' && contextKind === 'conversation' && (
          <ConversationPickerStep
            onPick={(conversation) => {
              setContext({ kind: 'conversation', conversation });
              setStep('form');
            }}
          />
        )}

        {step === 'form' && context && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <ContextSummary context={context} />

            <Select
              value={type}
              onChange={(e) => setType(e.target.value as DisputeType)}
              size="small"
              fullWidth
            >
              {DISPUTE_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Titre du litige"
              placeholder="Ex : Caution non restituée"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleDirty(true);
              }}
              size="small"
              fullWidth
              inputProps={{ maxLength: 255 }}
              error={titleDirty && title.trim().length < 5}
              helperText={
                titleDirty && title.trim().length < 5
                  ? `Encore ${5 - title.trim().length} caractère(s) requis`
                  : `${title.length}/255 (min. 5)`
              }
            />

            <TextField
              label="Décrivez le problème"
              placeholder="Donnez tous les détails utiles : dates, montants, échanges déjà eus avec l'autre partie…"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescDirty(true);
              }}
              size="small"
              fullWidth
              multiline
              minRows={4}
              inputProps={{ maxLength: 5000 }}
              error={descDirty && description.trim().length < 20}
              helperText={
                descDirty && description.trim().length < 20
                  ? `Encore ${20 - description.trim().length} caractère(s) requis`
                  : `${description.length}/5000 (min. 20)`
              }
            />

            <TextField
              label="Montant réclamé (FCFA) — optionnel"
              placeholder="Ex : 250 000"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              size="small"
              fullWidth
              type="text"
              inputMode="numeric"
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Annuler
        </Button>
        {step === 'form' && (
          <Button
            variant="contained"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            startIcon={
              createMutation.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
          >
            Ouvrir le litige
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Context selection                                          */
/* ------------------------------------------------------------------ */

function ContextStep({ onPick }: { onPick: (kind: ContextKind) => void }) {
  const cards: {
    kind: ContextKind;
    icon: React.ReactElement;
    label: string;
    sub: string;
  }[] = [
    {
      kind: 'ad',
      icon: <Apartment sx={{ fontSize: 28, color: 'primary.main' }} />,
      label: 'Une annonce',
      sub: 'Le bien ne correspond pas, accès refusé, propriétaire injoignable…',
    },
    {
      kind: 'conversation',
      icon: <ChatBubbleOutline sx={{ fontSize: 28, color: 'primary.main' }} />,
      label: 'Une conversation',
      sub: 'Vous avez déjà échangé avec une personne qui pose problème.',
    },
  ];

  return (
    <Stack spacing={1.5} sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Pour ouvrir un litige, vous devez avoir un lien préalable avec
        l&apos;autre partie (une annonce, une conversation, un paiement…). Cela
        protège la communauté contre les abus.
      </Typography>
      {cards.map((c) => (
        <Card key={c.kind} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardActionArea onClick={() => onPick(c.kind)} sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'action.hover', width: 48, height: 48 }}>
                {c.icon}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700}>{c.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.sub}
                </Typography>
              </Box>
            </Stack>
          </CardActionArea>
        </Card>
      ))}
      <Alert
        severity="info"
        icon={<HelpOutline />}
        sx={{ mt: 1, borderRadius: 1.5 }}
      >
        Aucun de ces cas ne s&apos;applique ? Contactez d&apos;abord le support
        depuis <strong>Aide &amp; FAQ</strong>.
      </Alert>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2A — Ad picker (unlocked ads only, client-side filter)        */
/* ------------------------------------------------------------------ */

function AdPickerStep({ onPick }: { onPick: (ad: Ad) => void }) {
  const [search, setSearch] = useState('');

  const { data: allAds = [], isFetching } = useQuery({
    queryKey: ['unlocked-ads'],
    queryFn: () => unlockedAdsService.list(),
    staleTime: 60_000,
  });

  const q = search.trim().toLowerCase();
  const ads = q
    ? allAds.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          (ad.quarter?.city_name ?? '').toLowerCase().includes(q)
      )
    : allAds;

  return (
    <Stack spacing={1.5} sx={{ py: 1 }}>
      <TextField
        size="small"
        autoFocus
        placeholder="Rechercher une annonce par titre, ville…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
      />

      {isFetching ? (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={64}
              sx={{ borderRadius: 1.5 }}
            />
          ))}
        </Stack>
      ) : ads.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', py: 3 }}
        >
          {search.trim()
            ? 'Aucune annonce correspondante.'
            : 'Vous n’avez pas encore d’annonce déverrouillée. Déverrouillez une annonce pour pouvoir ouvrir un litige.'}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {ads.map((ad) => (
            <Card key={ad.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea onClick={() => onPick(ad)} sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={ad.images?.[0]?.url ?? undefined}
                    variant="rounded"
                    sx={{ width: 48, height: 48, bgcolor: 'action.hover' }}
                  >
                    <Apartment />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      fontWeight={600}
                      sx={{ fontSize: '0.9rem' }}
                      noWrap
                    >
                      {ad.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {ad.user?.firstname ?? '—'} {ad.user?.lastname ?? ''}
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2B — Conversation picker                                      */
/* ------------------------------------------------------------------ */

function ConversationPickerStep({
  onPick,
}: {
  onPick: (c: Conversation) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations-disputes', 1],
    queryFn: () => fetchConversations(1),
    staleTime: 60_000,
  });

  const conversations = data?.data ?? [];

  if (isLoading) {
    return (
      <Stack spacing={1} sx={{ py: 1 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={64}
            sx={{ borderRadius: 1.5 }}
          />
        ))}
      </Stack>
    );
  }

  if (conversations.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', py: 4 }}
      >
        Vous n&apos;avez pas encore de conversation.
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      {conversations.map((c) => {
        const isReady = !!c.other_participant;
        return (
          <Card key={c.uuid} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardActionArea
              onClick={() => isReady && onPick(c)}
              disabled={!isReady}
              sx={{ p: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={c.other_participant?.avatar ?? undefined}
                  sx={{ width: 44, height: 44 }}
                >
                  {c.other_participant?.name?.[0] ?? '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontWeight={600}
                    sx={{ fontSize: '0.9rem' }}
                    noWrap
                  >
                    {c.other_participant?.name ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {c.ad?.title ?? '—'}
                  </Typography>
                </Box>
              </Stack>
            </CardActionArea>
          </Card>
        );
      })}
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Form helpers                                                        */
/* ------------------------------------------------------------------ */

function ContextSummary({ context }: { context: DisputeContext }) {
  if (context.kind === 'ad') {
    const ad = context.ad;
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={ad.images?.[0]?.url ?? undefined}
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: 'action.hover' }}
          >
            <Apartment fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              Litige concernant cette annonce
            </Typography>
            <Typography variant="body2" fontWeight={700} noWrap>
              {ad.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bailleur : {ad.user?.firstname ?? '—'} {ad.user?.lastname ?? ''}
            </Typography>
          </Box>
          <CheckCircle color="success" fontSize="small" />
        </Box>
      </Card>
    );
  }
  const c = context.conversation;
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={c.other_participant?.avatar ?? undefined}
          sx={{ width: 40, height: 40 }}
        >
          {c.other_participant?.name?.[0] ?? '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Litige concernant cette conversation
          </Typography>
          <Typography variant="body2" fontWeight={700} noWrap>
            {c.other_participant?.name ?? '—'}
          </Typography>
          {c.ad && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {c.ad.title}
            </Typography>
          )}
        </Box>
        <CheckCircle color="success" fontSize="small" />
      </Box>
    </Card>
  );
}
