'use client';

import { useThemeMode } from '@/providers/ThemeProvider';
import {
    ArrowForward as ArrowForwardIcon,
    AutoAwesome as AutoAwesomeIcon,
    Email as EmailIcon,
    ExpandMore as ExpandMoreIcon,
    Search as SearchIcon,
    WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Container,
    Grid,
    InputAdornment,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useState } from 'react';

const BRAND = '#F6475F';
const BRAND_DARK = '#C73048';
const NAVY = '#0A1628';

const STATS = [
  { value: '12 500+', label: 'Annonces publiées' },
  { value: '38 000+', label: 'Utilisateurs actifs' },
  { value: '< 24h', label: 'Délai réponse support' },
  { value: '4.8 / 5', label: 'Satisfaction client' },
];

const CATEGORIES = [
  { id: 'acheteur', emoji: '🔑', title: 'Acheteur & Locataire', desc: 'Trouver, visiter et acquérir votre bien idéal.', gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { id: 'vendeur', emoji: '🏷️', title: 'Vendeur & Propriétaire', desc: 'Publier et gérer vos annonces en toute simplicité.', gradient: 'linear-gradient(135deg, #F6475F 0%, #FF8C42 100%)' },
  { id: 'agent', emoji: '👔', title: 'Agent Immobilier', desc: 'Outils et ressources pour les professionnels.', gradient: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)' },
];

const GUIDE_TITLE = 'Publier votre première annonce en 5 minutes chrono';
const GUIDE_DESC = "De la création de compte à la mise en ligne : notre guide pas-à-pas pour que votre bien soit visible dès aujourd\'hui.";
const GUIDE_GRADIENT = `linear-gradient(135deg, ${NAVY} 0%, #1A2F5A 100%)`;

const GUIDES = [
  { tag: 'Sécurité', title: 'Sécuriser une transaction immobilière', color: '#667EEA' },
  { tag: 'Locataire', title: 'Checklist avant de signer un bail', color: '#11998E' },
  { tag: 'Compte', title: 'Comprendre le système de crédits', color: '#F6475F' },
  { tag: 'Photos', title: 'Prendre des photos qui vendent', color: '#FF8C42' },
  { tag: 'Agent', title: 'Obtenir le badge Agent Vérifié', color: '#764BA2' },
];

const FAQ_ITEMS = [
  { cat: 'acheteur', catLabel: 'Acheteur', q: "Comment contacter le propriétaire d\'une annonce ?", a: "Cliquez sur «Contacter» sur l’annonce. Vous serez invité à créer un compte si vous n’êtes pas connecté. Le propriétaire vous répondra par e-mail ou téléphone." },
  { cat: 'acheteur', catLabel: 'Acheteur', q: 'Comment sauvegarder une annonce en favori ?', a: "Cliquez sur l’icône ❤️ sur une carte ou la page de détail. Vos favoris sont accessibles depuis votre profil. Connexion requise." },
  { cat: 'acheteur', catLabel: 'Acheteur', q: 'Comment filtrer par ville ou quartier ?', a: "Utilisez l’autocomplete de la page d’accueil ou la page Recherche avec ses filtres avancés : type de bien, chambres, superficie, prix et carte interactive." },
  { cat: 'vendeur', catLabel: 'Vendeur', q: 'Comment publier une annonce sur KeyHome ?', a: "Cliquez sur «Publier» dans le menu. Renseignez type, localisation, caractéristiques, ajoutez des photos et une description. Votre annonce est examinée sous 24h." },
  { cat: 'vendeur', catLabel: 'Vendeur', q: "Combien coûte la publication d\'une annonce ?", a: "KeyHome utilise un système de crédits. 1 annonce = 1 crédit. Des forfaits mensuels sont disponibles dans la rubrique «Crédits»." },
  { cat: 'vendeur', catLabel: 'Vendeur', q: 'Comment modifier ou supprimer mon annonce ?', a: "Rendez-vous dans «Mes annonces» depuis votre profil. Cliquez sur l’annonce puis «Modifier» ou «Supprimer». La suppression est définitive." },
  { cat: 'agent', catLabel: 'Agent', q: 'Comment créer un compte professionnel ?', a: "Lors de l’inscription, sélectionnez «Compte professionnel / Agence». Vous bénéficiez d’un tableau de bord dédié et d’un badge «Agent vérifié» après validation." },
  { cat: 'agent', catLabel: 'Agent', q: 'Comment obtenir le badge «Agent vérifié» ?', a: "Envoyez votre carte professionnelle ou agrément à support@keyhome.app. Notre équipe valide votre dossier sous 48h ouvrables." },
];

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ textAlign: 'center', px: { xs: 2.5, md: 4 } }}>
      <Typography sx={{ fontSize: { xs: '1.6rem', md: '2.2rem' }, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mt: 0.5, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Typography>
    </Box>
  );
}

export default function AidePage() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>(false);

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchCat = !activeCat || item.cat === activeCat;
    const q = search.toLowerCase();
    return matchCat && (!q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  });

  return (
    <Box sx={{ pb: 0 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${NAVY} 0%, #0F2044 40%, #1A1035 100%)`,
          overflow: 'hidden',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
        }}
      >
        {/* Decorative blobs + grid */}
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', top: '-15%', right: '-5%', width: { xs: 280, md: 480 }, height: { xs: 280, md: 480 }, borderRadius: '50%', background: 'radial-gradient(circle, #F6475F22 0%, transparent 70%)' }} />
          <Box sx={{ position: 'absolute', bottom: '-20%', left: '-8%', width: { xs: 200, md: 360 }, height: { xs: 200, md: 360 }, borderRadius: '50%', background: 'radial-gradient(circle, #667EEA22 0%, transparent 70%)' }} />
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          {/* Badge */}
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#F6475F22', border: '1px solid #F6475F44', borderRadius: '50px', px: 2, py: 0.6, mb: 4 }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: BRAND }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: BRAND, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Centre d&apos;aide KeyHome
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{ fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' }, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1.05, mb: 2.5 }}
          >
            Comment pouvons-nous<br />vous{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #F6475F 0%, #FF8C42 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              aider
            </Box>{' '}?
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: { xs: '1rem', md: '1.1rem' }, mb: 6, maxWidth: 460, mx: 'auto', lineHeight: 1.75 }}>
            Questions fréquentes, guides étape par étape,<br />et un support humain pour vous accompagner.
          </Typography>

          {/* Search */}
          <Box sx={{ maxWidth: 560, mx: 'auto' }}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '1rem', py: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)' },
                  '&.Mui-focused': { bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid #F6475F88', boxShadow: '0 0 0 3px #F6475F22' },
                  '& fieldset': { display: 'none' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: search.length > 0 ? (
                  <InputAdornment position="end">
                    <Chip label={String(filtered.length)} size="small" sx={{ bgcolor: '#F6475F33', color: BRAND, fontWeight: 700, fontSize: '0.72rem', border: '1px solid #F6475F44', height: 22 }} />
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <Box sx={{ background: 'linear-gradient(90deg, #070E1C 0%, #0F1E3A 50%, #070E1C 100%)', py: { xs: 4, md: 3.5 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', '& > *:not(:last-child)': { borderRight: '1px solid rgba(255,255,255,0.1)' } }}>
            {STATS.map((s) => <StatPill key={s.label} value={s.value} label={s.label} />)}
          </Box>
        </Container>
      </Box>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: isDark ? 'background.default' : '#F8F9FC', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography sx={{ color: BRAND, fontWeight: 700, letterSpacing: 2, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>
              Parcourir par profil
            </Typography>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} sx={{ letterSpacing: -0.5 }}>
              Quel est votre profil ?
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
                      borderRadius: '20px', cursor: 'pointer', border: '2px solid',
                      borderColor: isActive ? 'transparent' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      background: isActive ? cat.gradient : isDark ? '#1A1E2E' : '#fff',
                      boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)',
                      transform: isActive ? 'scale(1.02) translateY(-4px)' : 'none',
                      transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                      '&:hover': {
                        transform: isActive ? 'scale(1.02) translateY(-4px)' : 'translateY(-6px)',
                        boxShadow: isActive ? '0 24px 64px rgba(0,0,0,0.25)' : '0 12px 40px rgba(0,0,0,0.1)',
                      },
                      p: { xs: 3.5, md: 4 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ fontSize: 44, lineHeight: 1, mb: 2.5, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', bgcolor: isActive ? 'rgba(255,255,255,0.18)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                        {cat.emoji}
                      </Box>
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isActive ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', transition: 'transform 0.3s', transform: isActive ? 'rotate(45deg)' : 'none' }}>
                        <ArrowForwardIcon sx={{ fontSize: 18, color: isActive ? '#fff' : 'text.secondary' }} />
                      </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: isActive ? '#fff' : 'text.primary', mb: 0.75 }}>{cat.title}</Typography>
                    <Typography variant="body2" sx={{ color: isActive ? 'rgba(255,255,255,0.72)' : 'text.secondary', lineHeight: 1.65 }}>{cat.desc}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="flex-start">

            {/* Sticky sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 100 }}>
                <Typography sx={{ color: BRAND, fontWeight: 700, letterSpacing: 2, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>FAQ</Typography>
                <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} sx={{ mb: 2, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  Questions<br />fréquentes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
                  Retrouvez les réponses aux questions les plus posées par notre communauté.
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
                        fontWeight: 600, cursor: 'pointer',
                        ...(activeCat === item.id
                          ? { bgcolor: BRAND, color: '#fff', '&:hover': { bgcolor: BRAND_DARK } }
                          : { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)' } }),
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Accordion */}
            <Grid size={{ xs: 12, md: 8 }}>
              {filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ fontSize: 48 }}>🔍</Typography>
                  <Typography color="text.secondary" sx={{ mt: 2 }}>Aucun résultat — essayez d&apos;autres mots-clés.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filtered.map((item, idx) => (
                    <Accordion
                      key={idx}
                      expanded={expanded === `faq-${idx}`}
                      onChange={(_, open) => setExpanded(open ? `faq-${idx}` : false)}
                      disableGutters elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: expanded === `faq-${idx}` ? '#F6475F44' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                        borderRadius: '14px !important',
                        bgcolor: expanded === `faq-${idx}` ? isDark ? '#F6475F0D' : '#F6475F05' : 'background.paper',
                        transition: 'all 0.25s ease',
                        '&:before': { display: 'none' },
                        '&:hover': { borderColor: expanded === `faq-${idx}` ? '#F6475F66' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.13)' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: expanded === `faq-${idx}` ? '#F6475F22' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                            <ExpandMoreIcon sx={{ fontSize: 18, color: expanded === `faq-${idx}` ? BRAND : 'text.secondary' }} />
                          </Box>
                        }
                        sx={{ px: 3, py: 1.5, alignItems: 'flex-start' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Chip label={item.catLabel} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: '#F6475F18', color: BRAND, border: '1px solid #F6475F33', flexShrink: 0 }} />
                          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', md: '0.95rem' }, lineHeight: 1.5 }}>{item.q}</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Box sx={{ borderLeft: '3px solid #F6475F', pl: 2.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>{item.a}</Typography>
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

      {/* ── GUIDES ────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: isDark ? '#0A0E1A' : '#F8F9FC', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            <Typography sx={{ color: BRAND, fontWeight: 700, letterSpacing: 2, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>Ressources</Typography>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} sx={{ letterSpacing: -0.5 }}>Guides & Articles</Typography>
          </Box>
          <Grid container spacing={3} alignItems="stretch">
            {/* Featured card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  background: GUIDE_GRADIENT,
                  borderRadius: '20px', p: { xs: 4, md: 5 }, height: '100%', minHeight: 300,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 28px 72px rgba(0,0,0,0.35)' },
                }}
              >
                <Box sx={{ position: 'absolute', top: -25, right: -25, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <Box sx={{ position: 'relative' }}>
                  <Chip label="Guide complet" size="small" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }} />
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.3, letterSpacing: -0.5, mb: 2 }}>{GUIDE_TITLE}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.8 }}>{GUIDE_DESC}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>Lire le guide</Typography>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
              </Box>
            </Grid>

            {/* Mini cards */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                {GUIDES.map((g, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 2.5,
                      borderRadius: '14px', p: 2.5,
                      bgcolor: isDark ? '#1A1E2E' : '#fff',
                      border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      cursor: 'pointer', transition: 'all 0.25s ease',
                      '&:hover': { transform: 'translateX(8px)', borderColor: g.color, boxShadow: `0 4px 24px ${g.color}1A` },
                    }}
                  >
                    <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '12px', bgcolor: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: g.color, opacity: 0.85 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: g.color, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>{g.tag}</Typography>
                      <Typography fontWeight={600} sx={{ fontSize: '0.875rem', mt: 0.3, lineHeight: 1.4 }}>{g.title}</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CONTACT CTA ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #F6475F 0%, #C73048 45%, #9B1B30 100%)',
          py: { xs: 8, md: 11 }, position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', top: '-30%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'absolute', bottom: '-40%', left: '0%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,0,0,0.09)' }} />
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        </Box>
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={900} sx={{ color: '#fff', letterSpacing: -1, mb: 2, lineHeight: 1.15 }}>
            Vous n&apos;avez pas trouvé<br />votre réponse ?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 6, fontSize: '1.05rem', maxWidth: 440, mx: 'auto', lineHeight: 1.75 }}>
            Notre équipe est disponible du lundi au vendredi,<br />de 8h à 18h, pour vous accompagner personnellement.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large" href="mailto:support@keyhome.app" startIcon={<EmailIcon />}
              sx={{ bgcolor: '#fff', color: '#F6475F', fontWeight: 700, borderRadius: '14px', px: 4, py: 1.6, fontSize: '0.95rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#f5f5f5', transform: 'translateY(-3px)', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }, transition: 'all 0.3s ease' }}
            >
              support@keyhome.app
            </Button>
            <Button
              variant="outlined" size="large" href="https://wa.me/+237600000000" target="_blank" rel="noopener noreferrer" startIcon={<WhatsAppIcon />}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700, borderRadius: '14px', px: 4, py: 1.6, fontSize: '0.95rem', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderWidth: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', borderColor: '#fff', transform: 'translateY(-3px)' }, transition: 'all 0.3s ease' }}
            >
              WhatsApp
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
