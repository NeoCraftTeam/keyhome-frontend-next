'use client';

import { useThemeMode } from '@/providers/ThemeProvider';
import { brand } from '@/theme/tokens';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FadeIn from '@/components/ui/FadeIn';

const BRAND = brand.primary;
const BRAND_DARK = '#C73048';
const NAVY = '#0A1628';

const CATEGORIES = [
  {
    id: 'acheteur',
    Icon: KeyIcon,
    title: 'Acheteur & Locataire',
    desc: 'Trouver, visiter et acqu\u00e9rir votre bien id\u00e9al.',
  },
  {
    id: 'vendeur',
    Icon: StorefrontIcon,
    title: 'Vendeur & Propri\u00e9taire',
    desc: 'Publier et g\u00e9rer vos annonces en toute simplicit\u00e9.',
  },
  {
    id: 'agent',
    Icon: PersonIcon,
    title: 'Agent Immobilier',
    desc: 'Outils et ressources pour les professionnels.',
  },
];

const GUIDES = [
  {
    tag: 'S\u00e9curit\u00e9',
    title: 'S\u00e9curiser une transaction immobili\u00e8re',
    Icon: HomeWorkIcon,
  },
  {
    tag: 'Locataire',
    title: 'Checklist avant de signer un bail',
    Icon: KeyIcon,
  },
  {
    tag: 'Compte',
    title: 'Comprendre le syst\u00e8me de cr\u00e9dits',
    Icon: StorefrontIcon,
  },
  {
    tag: 'Photos',
    title: 'Prendre des photos qui vendent',
    Icon: HomeWorkIcon,
  },
  {
    tag: 'Agent',
    title: 'Obtenir le badge Agent V\u00e9rifi\u00e9',
    Icon: PersonIcon,
  },
];

const FAQ_ITEMS = [
  {
    cat: 'acheteur',
    catLabel: 'Acheteur',
    q: 'Comment contacter le propri\u00e9taire d\u2019une annonce\u00a0?',
    a: 'Ouvrez la fiche de l\u2019annonce et cliquez sur \u00abContacter\u00bb. Si vous n\u2019\u00eates pas encore connect\u00e9, vous serez invit\u00e9 \u00e0 cr\u00e9er un compte. Le propri\u00e9taire recevra votre demande et pourra vous r\u00e9pondre via e-mail ou t\u00e9l\u00e9phone.',
  },
  {
    cat: 'acheteur',
    catLabel: 'Acheteur',
    q: 'Comment sauvegarder une annonce en favori\u00a0?',
    a: 'Cliquez sur l\u2019ic\u00f4ne en forme de c\u0153ur sur la carte d\u2019annonce ou la page de d\u00e9tail. Tous vos favoris sont accessibles depuis votre profil. La connexion est requise.',
  },
  {
    cat: 'acheteur',
    catLabel: 'Acheteur',
    q: 'Comment filtrer par ville ou quartier\u00a0?',
    a: 'Utilisez la barre de recherche avec auto-compl\u00e9tion sur la page d\u2019accueil, ou rendez-vous sur la page Recherche pour acc\u00e9der \u00e0 des filtres avanc\u00e9s : type de bien, nombre de chambres, superficie, fourchette de prix et carte interactive.',
  },
  {
    cat: 'acheteur',
    catLabel: 'Acheteur',
    q: 'Comment planifier une visite\u00a0?',
    a: 'Sur la page de d\u00e9tail d\u2019une annonce d\u00e9verrouill\u00e9e, cliquez sur \u00abPlanifier une visite\u00bb. S\u00e9lectionnez une date et un cr\u00e9neau parmi les disponibilit\u00e9s du propri\u00e9taire, puis confirmez. Le propri\u00e9taire sera notifi\u00e9 et vous recevrez une confirmation.',
  },
  {
    cat: 'acheteur',
    catLabel: 'Acheteur',
    q: 'Qu\u2019est-ce que le Score de Confiance\u00a0?',
    a: 'Le Score de Confiance (TrustScore) est un indicateur de fiabilit\u00e9 calcul\u00e9 automatiquement \u00e0 partir de votre historique sur KeyHome : visites honor\u00e9es, profil complet, avis re\u00e7us, anciennet\u00e9 du compte. Il aide les propri\u00e9taires \u00e0 identifier les locataires s\u00e9rieux. Vous pouvez l\u2019activer ou le d\u00e9sactiver \u00e0 tout moment dans vos param\u00e8tres.',
  },
  {
    cat: 'vendeur',
    catLabel: 'Vendeur',
    q: 'Comment publier une annonce sur KeyHome\u00a0?',
    a: 'Cliquez sur \u00abPublier\u00bb dans le menu principal. Renseignez le type de bien, la localisation, les caract\u00e9ristiques, ajoutez des photos de qualit\u00e9 et r\u00e9digez une description d\u00e9taill\u00e9e. Votre annonce sera examin\u00e9e par notre \u00e9quipe sous 24 heures.',
  },
  {
    cat: 'vendeur',
    catLabel: 'Vendeur',
    q: 'Combien co\u00fbte la publication d\u2019une annonce\u00a0?',
    a: 'KeyHome fonctionne avec un syst\u00e8me de cr\u00e9dits. La publication d\u2019une annonce consomme 1 cr\u00e9dit. Diff\u00e9rents forfaits sont disponibles dans la section \u00abCr\u00e9dits\u00bb de votre tableau de bord.',
  },
  {
    cat: 'vendeur',
    catLabel: 'Vendeur',
    q: 'Comment modifier ou supprimer mon annonce\u00a0?',
    a: 'Rendez-vous dans \u00abMes annonces\u00bb depuis votre profil. S\u00e9lectionnez l\u2019annonce concern\u00e9e, puis utilisez les options \u00abModifier\u00bb ou \u00abSupprimer\u00bb. Attention, la suppression est d\u00e9finitive.',
  },
  {
    cat: 'vendeur',
    catLabel: 'Vendeur',
    q: 'Comment g\u00e9rer mes disponibilit\u00e9s de visite\u00a0?',
    a: 'Depuis le panneau propri\u00e9taire, acc\u00e9dez \u00e0 \u00abMes disponibilit\u00e9s\u00bb. Vous pouvez cr\u00e9er des plages horaires ponctuelles ou r\u00e9currentes (hebdomadaires, bimensuelles, mensuelles), d\u00e9finir la dur\u00e9e des cr\u00e9neaux et ajouter un temps tampon entre chaque visite.',
  },
  {
    cat: 'vendeur',
    catLabel: 'Vendeur',
    q: 'Comment fonctionne le Score de Confiance pour les propri\u00e9taires\u00a0?',
    a: 'Les propri\u00e9taires ont aussi un Score de Confiance, calcul\u00e9 sur la qualit\u00e9 des annonces, le taux de r\u00e9ponse, les avis des locataires et l\u2019historique des baux. Un score \u00e9lev\u00e9 rassure les locataires et augmente les demandes de visite.',
  },
  {
    cat: 'agent',
    catLabel: 'Agent',
    q: 'Comment cr\u00e9er un compte professionnel\u00a0?',
    a: 'Lors de votre inscription, s\u00e9lectionnez le type \u00abCompte professionnel / Agence\u00bb. Vous b\u00e9n\u00e9ficierez d\u2019un tableau de bord d\u00e9di\u00e9, d\u2019outils de gestion avanc\u00e9s et d\u2019un badge \u00abAgent v\u00e9rifi\u00e9\u00bb apr\u00e8s validation de votre dossier.',
  },
  {
    cat: 'agent',
    catLabel: 'Agent',
    q: 'Comment obtenir le badge \u00abAgent v\u00e9rifi\u00e9\u00bb\u00a0?',
    a: 'Transmettez votre carte professionnelle ou votre agr\u00e9ment \u00e0 support@keyhome.app. Notre \u00e9quipe traite chaque demande sous 48 heures ouvrables et vous notifiera d\u00e8s la validation.',
  },
];

const COMPANY_STATS = [
  { value: '10K+', label: 'Annonces publi\u00e9es' },
  { value: '50K+', label: 'Utilisateurs actifs' },
  { value: '15+', label: 'Villes couvertes' },
  { value: '4.8/5', label: 'Note moyenne' },
];

const COMPANY_VALUES = [
  {
    Icon: HomeWorkIcon,
    title: 'Transparence',
    desc: 'Des informations v\u00e9rifi\u00e9es, des prix r\u00e9els, z\u00e9ro frais cach\u00e9s.',
  },
  {
    Icon: KeyIcon,
    title: 'S\u00e9curit\u00e9',
    desc: 'Score de confiance bidirectionnel, paiements s\u00e9curis\u00e9s, donn\u00e9es chiffr\u00e9es.',
  },
  {
    Icon: PersonIcon,
    title: 'Accessibilit\u00e9',
    desc: 'Une plateforme pour tous, du studio \u00e9tudiant \u00e0 la villa familiale.',
  },
];

export default function AidePage() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>(false);

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchCat = !activeCat || item.cat === activeCat;
    const q = search.toLowerCase();
    return (
      matchCat &&
      (!q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q))
    );
  });

  return (
    <Box sx={{ pb: 0 }}>
      {/* Back button */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 70, md: 76 },
          left: { xs: 12, md: 20 },
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          size="small"
          aria-label="Retour"
          sx={{
            bgcolor: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      {/* HERO */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${NAVY} 0%, #0F2044 40%, #1A1035 100%)`,
          overflow: 'hidden',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-15%',
              right: '-5%',
              width: { xs: 280, md: 480 },
              height: { xs: 280, md: 480 },
              borderRadius: '50%',
              background: `radial-gradient(circle, ${BRAND}22 0%, transparent 70%)`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-20%',
              left: '-8%',
              width: { xs: 200, md: 360 },
              height: { xs: 200, md: 360 },
              borderRadius: '50%',
              background: `radial-gradient(circle, ${BRAND}15 0%, transparent 70%)`,
            }}
          />
        </Box>

        <Container
          maxWidth="md"
          sx={{ position: 'relative', textAlign: 'center' }}
        >
          <FadeIn>
            <Chip
              label="Centre d'aide"
              size="small"
              sx={{
                mb: 4,
                bgcolor: `${BRAND}22`,
                color: BRAND,
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: 1,
                border: `1px solid ${BRAND}44`,
              }}
            />

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' },
                fontWeight: 900,
                color: '#fff',
                letterSpacing: -2,
                lineHeight: 1.05,
                mb: 2.5,
              }}
            >
              Comment pouvons-nous
              <br />
              vous{' '}
              <Box component="span" sx={{ color: BRAND }}>
                aider
              </Box>
              &nbsp;?
            </Typography>

            <Typography
              sx={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                mb: 6,
                maxWidth: 460,
                mx: 'auto',
                lineHeight: 1.75,
              }}
            >
              Questions fr&eacute;quentes, guides pratiques et support
              disponible pour vous accompagner.
            </Typography>

            <Box sx={{ maxWidth: 560, mx: 'auto' }}>
              <TextField
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une question..."
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '1rem',
                    py: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.22)',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      border: `1px solid ${BRAND}88`,
                      boxShadow: `0 0 0 3px ${BRAND}22`,
                    },
                    '& fieldset': { display: 'none' },
                    '& input::placeholder': {
                      color: 'rgba(255,255,255,0.35)',
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 22 }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment:
                    search.length > 0 ? (
                      <InputAdornment position="end">
                        <Chip
                          label={String(filtered.length)}
                          size="small"
                          sx={{
                            bgcolor: `${BRAND}33`,
                            color: BRAND,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            border: `1px solid ${BRAND}44`,
                            height: 22,
                          }}
                        />
                      </InputAdornment>
                    ) : null,
                }}
              />
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* CATEGORIES */}
      <Box
        sx={{
          bgcolor: isDark ? 'background.default' : '#F8F9FC',
          py: { xs: 7, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              sx={{
                color: BRAND,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Parcourir par profil
            </Typography>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              fontWeight={800}
              sx={{ letterSpacing: -0.5 }}
            >
              Quel est votre profil&nbsp;?
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCat === cat.id;
              return (
                <Grid key={cat.id} size={{ xs: 12, sm: 4 }}>
                  <Box
                    onClick={() => setActiveCat(isActive ? null : cat.id)}
                    sx={{
                      borderRadius: '20px',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isActive
                        ? BRAND
                        : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                      background: isActive
                        ? isDark
                          ? `linear-gradient(135deg, ${BRAND}28 0%, ${BRAND}0A 100%)`
                          : `linear-gradient(135deg, ${BRAND}12 0%, ${BRAND}04 100%)`
                        : isDark
                          ? '#1A1E2E'
                          : '#fff',
                      boxShadow: isActive
                        ? `0 8px 32px ${BRAND}20`
                        : '0 2px 12px rgba(0,0,0,0.04)',
                      transform: isActive ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: isActive
                          ? `0 12px 40px ${BRAND}28`
                          : '0 8px 32px rgba(0,0,0,0.08)',
                      },
                      p: { xs: 3.5, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '14px',
                          mb: 2.5,
                          bgcolor: isActive
                            ? `${BRAND}20`
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                        }}
                      >
                        <cat.Icon
                          sx={{
                            fontSize: 28,
                            color: isActive ? BRAND : 'text.secondary',
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isActive
                            ? `${BRAND}20`
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.05)',
                          transition: 'transform 0.3s',
                          transform: isActive ? 'rotate(45deg)' : 'none',
                        }}
                      >
                        <ArrowForwardIcon
                          sx={{
                            fontSize: 18,
                            color: isActive ? BRAND : 'text.secondary',
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ color: 'text.primary', mb: 0.75 }}
                    >
                      {cat.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', lineHeight: 1.65 }}
                    >
                      {cat.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 100 }}>
                <Typography
                  sx={{
                    color: BRAND,
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    mb: 1,
                  }}
                >
                  FAQ
                </Typography>
                <Typography
                  variant={isMobile ? 'h5' : 'h4'}
                  fontWeight={800}
                  sx={{ mb: 2, letterSpacing: -0.5, lineHeight: 1.2 }}
                >
                  Questions
                  <br />
                  fr&eacute;quentes
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8, mb: 3 }}
                >
                  Retrouvez les r&eacute;ponses aux questions les plus
                  pos&eacute;es par notre communaut&eacute;.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { id: null, label: 'Toutes' },
                    { id: 'acheteur', label: 'Acheteur' },
                    { id: 'vendeur', label: 'Vendeur' },
                    { id: 'agent', label: 'Agent' },
                  ].map((item) => (
                    <Chip
                      key={String(item.id)}
                      label={item.label}
                      onClick={() => setActiveCat(item.id)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(activeCat === item.id
                          ? {
                              bgcolor: BRAND,
                              color: '#fff',
                              '&:hover': { bgcolor: BRAND_DARK },
                            }
                          : {
                              bgcolor: isDark
                                ? 'rgba(255,255,255,0.07)'
                                : 'rgba(0,0,0,0.05)',
                              '&:hover': {
                                bgcolor: isDark
                                  ? 'rgba(255,255,255,0.12)'
                                  : 'rgba(0,0,0,0.09)',
                              },
                            }),
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              {filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SearchIcon
                    sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                  />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Aucun r&eacute;sultat pour votre recherche. Essayez
                    d&apos;autres mots-cl&eacute;s.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                >
                  {filtered.map((item, idx) => (
                    <Accordion
                      key={idx}
                      expanded={expanded === `faq-${idx}`}
                      onChange={(_, open) =>
                        setExpanded(open ? `faq-${idx}` : false)
                      }
                      disableGutters
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor:
                          expanded === `faq-${idx}`
                            ? `${BRAND}44`
                            : isDark
                              ? 'rgba(255,255,255,0.07)'
                              : 'rgba(0,0,0,0.07)',
                        borderRadius: '14px !important',
                        bgcolor:
                          expanded === `faq-${idx}`
                            ? isDark
                              ? `${BRAND}0D`
                              : `${BRAND}05`
                            : 'background.paper',
                        transition: 'all 0.25s ease',
                        '&:before': { display: 'none' },
                        '&:hover': {
                          borderColor:
                            expanded === `faq-${idx}`
                              ? `${BRAND}66`
                              : isDark
                                ? 'rgba(255,255,255,0.15)'
                                : 'rgba(0,0,0,0.13)',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor:
                                expanded === `faq-${idx}`
                                  ? `${BRAND}22`
                                  : isDark
                                    ? 'rgba(255,255,255,0.06)'
                                    : 'rgba(0,0,0,0.05)',
                            }}
                          >
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 18,
                                color:
                                  expanded === `faq-${idx}`
                                    ? BRAND
                                    : 'text.secondary',
                              }}
                            />
                          </Box>
                        }
                        sx={{ px: 3, py: 1.5, alignItems: 'flex-start' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip
                            label={item.catLabel}
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              height: 20,
                              bgcolor: `${BRAND}18`,
                              color: BRAND,
                              border: `1px solid ${BRAND}33`,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            fontWeight={600}
                            sx={{
                              fontSize: { xs: '0.875rem', md: '0.95rem' },
                              lineHeight: 1.5,
                            }}
                          >
                            {item.q}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Box sx={{ borderLeft: `3px solid ${BRAND}`, pl: 2.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.85 }}
                          >
                            {item.a}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* GUIDES */}
      <Box
        sx={{ bgcolor: isDark ? '#0A0E1A' : '#F8F9FC', py: { xs: 7, md: 10 } }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            <Typography
              sx={{
                color: BRAND,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Ressources
            </Typography>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              fontWeight={800}
              sx={{ letterSpacing: -0.5 }}
            >
              Guides & Articles
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="stretch">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${NAVY} 0%, #1A2F5A 100%)`,
                  borderRadius: '20px',
                  p: { xs: 4, md: 5 },
                  height: '100%',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 28px 72px rgba(0,0,0,0.35)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -25,
                    right: -25,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                />
                <Box sx={{ position: 'relative' }}>
                  <Chip
                    label="Guide complet"
                    size="small"
                    sx={{
                      mb: 3,
                      bgcolor: 'rgba(255,255,255,0.14)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                    }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      color: '#fff',
                      lineHeight: 1.3,
                      letterSpacing: -0.5,
                      mb: 2,
                    }}
                  >
                    Publier votre premi&egrave;re annonce en 5 minutes
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.8 }}
                  >
                    De la cr&eacute;ation de compte &agrave; la mise en ligne :
                    un guide pas-&agrave;-pas pour rendre votre bien visible
                    d&egrave;s aujourd&apos;hui.
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: '#fff' }}
                  >
                    Lire le guide
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  height: '100%',
                }}
              >
                {GUIDES.map((g, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      borderRadius: '14px',
                      p: 2.5,
                      bgcolor: isDark ? '#1A1E2E' : '#fff',
                      border: '1px solid',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        borderColor: BRAND,
                        boxShadow: `0 4px 24px ${BRAND}1A`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: '12px',
                        bgcolor: `${BRAND}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <g.Icon
                        sx={{ fontSize: 22, color: BRAND, opacity: 0.85 }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          color: BRAND,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          fontSize: '0.68rem',
                        }}
                      >
                        {g.tag}
                      </Typography>
                      <Typography
                        fontWeight={600}
                        sx={{ fontSize: '0.875rem', mt: 0.3, lineHeight: 1.4 }}
                      >
                        {g.title}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon
                      sx={{
                        fontSize: 18,
                        color: 'text.disabled',
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CONTACT CTA */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 45%, #9B1B30 100%)`,
          py: { xs: 8, md: 11 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box
            sx={{
              position: 'absolute',
              top: '-30%',
              right: '5%',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-40%',
              left: '0%',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.09)',
            }}
          />
        </Box>
        <Container
          maxWidth="md"
          sx={{ position: 'relative', textAlign: 'center' }}
        >
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            fontWeight={900}
            sx={{ color: '#fff', letterSpacing: -1, mb: 2, lineHeight: 1.15 }}
          >
            Vous n&apos;avez pas trouv&eacute;
            <br />
            votre r&eacute;ponse&nbsp;?
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.7)',
              mb: 6,
              fontSize: '1.05rem',
              maxWidth: 440,
              mx: 'auto',
              lineHeight: 1.75,
            }}
          >
            Notre &eacute;quipe est disponible du lundi au vendredi, de 8h
            &agrave; 18h, pour vous accompagner.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              size="large"
              href="mailto:support@keyhome.app"
              startIcon={<EmailIcon />}
              sx={{
                bgcolor: '#fff',
                color: BRAND,
                fontWeight: 700,
                borderRadius: '14px',
                px: 4,
                py: 1.6,
                fontSize: '0.95rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              support@keyhome.app
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="https://wa.me/+237600000000"
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                borderRadius: '14px',
                px: 4,
                py: 1.6,
                fontSize: '0.95rem',
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderWidth: 1.5,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.18)',
                  borderColor: '#fff',
                  transform: 'translateY(-3px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              WhatsApp
            </Button>
          </Box>
        </Container>
      </Box>

      {/* COMPANY INFO */}
      <Box
        sx={{ bgcolor: isDark ? '#0A0E1A' : '#F8F9FC', py: { xs: 7, md: 10 } }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              sx={{
                color: BRAND,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              À propos
            </Typography>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              fontWeight={800}
              sx={{ letterSpacing: -0.5, mb: 2 }}
            >
              Qui est KeyHome&nbsp;?
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}
            >
              KeyHome est la plateforme immobilière de référence en Afrique
              francophone. Nous connectons propriétaires, locataires et agents
              dans un écosystème de confiance, transparent et sécurisé.
            </Typography>
          </Box>

          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: { xs: 5, md: 7 } }}>
            {COMPANY_STATS.map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: { xs: 3, md: 4 },
                    borderRadius: '16px',
                    bgcolor: isDark ? '#1A1E2E' : '#fff',
                    border: '1px solid',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '1.8rem', md: '2.4rem' },
                      fontWeight: 900,
                      color: BRAND,
                      letterSpacing: -1,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Values */}
          <Grid container spacing={3}>
            {COMPANY_VALUES.map((val) => (
              <Grid key={val.title} size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: { xs: 3.5, md: 4 },
                    borderRadius: '20px',
                    bgcolor: isDark ? '#1A1E2E' : '#fff',
                    border: '1px solid',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(0,0,0,0.06)',
                    height: '100%',
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '14px',
                      mb: 2.5,
                      bgcolor: `${BRAND}12`,
                    }}
                  >
                    <val.Icon sx={{ fontSize: 28, color: BRAND }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>
                    {val.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65 }}
                  >
                    {val.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 5 } }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              <strong>NéoCraft SARL</strong> — Douala, Cameroun
              <br />
              RCCM: RC/DLA/2024/A/XXXX · N° Contribuable: M0XXX00XXXXX
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* LEGAL FOOTER */}
      <Box
        sx={{
          py: { xs: 4, md: 5 },
          bgcolor: isDark ? 'background.default' : '#fff',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 1.5, md: 3 },
            }}
          >
            <Link
              href="/confidentialite"
              style={{
                color: BRAND,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Confidentialité
            </Link>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              ·
            </Typography>
            <Link
              href="/conditions"
              style={{
                color: BRAND,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Conditions générales
            </Link>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              ·
            </Typography>
            <Link
              href="/"
              style={{
                color: '#6B7280',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Accueil
            </Link>
          </Box>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ textAlign: 'center', mt: 2, fontSize: '0.8rem' }}
          >
            © {new Date().getFullYear()} KeyHome — NéoCraft SARL. Tous droits
            réservés.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
