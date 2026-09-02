'use client';

import { Box, Button, Container, Paper, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FadeIn from '@/components/ui/layout/FadeIn';
import { useParams, useRouter } from 'next/navigation';
import { brand } from '@/theme/tokens';

export default function SurveyMerciPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const handleShare = async () => {
    const url = `${window.location.origin}/surveys/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: 'Partagez ce sondage', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 14 } }}>
      <FadeIn direction="up">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 7 },
            textAlign: 'center',
            borderRadius: 5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Animated checkmark */}
          <Box
            sx={{
              display: 'inline-flex',
              mb: 3,
              p: 2.5,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(46,125,50,0.12) 0%, rgba(46,125,50,0.06) 100%)',
              '@keyframes popIn': {
                '0%': { transform: 'scale(0.6)', opacity: 0 },
                '70%': { transform: 'scale(1.12)' },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
              animation: 'popIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 72,
                color: '#2E7D32',
                filter: 'drop-shadow(0 4px 12px rgba(46,125,50,0.20))',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            gutterBottom
            sx={{ letterSpacing: '-0.02em' }}
          >
            Merci pour votre avis&nbsp;!
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 5, lineHeight: 1.7, fontSize: '1.05rem' }}
          >
            Vos réponses ont bien été enregistrées anonymement. Votre retour
            nous aide à améliorer KeyHome pour toute notre communauté.
          </Typography>

          {/* Anonymity reminder */}
          <Box
            sx={{
              mb: 5,
              px: 3,
              py: 2,
              borderRadius: 2.5,
              bgcolor: brand.primaryAlpha5,
              border: '1px solid rgba(246,71,95,0.15)',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              🔒&nbsp; Vos réponses ne peuvent en aucun cas être reliées à votre
              identité.
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => router.push('/surveys')}
              size="large"
              sx={{
                borderRadius: 2.5,
                py: 1.5,
                fontWeight: 700,
                background: brand.primary,
                boxShadow: '0 6px 20px rgba(246,71,95,0.28)',
                '&:hover': {
                  boxShadow: '0 8px 28px rgba(246,71,95,0.38)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              Voir d&apos;autres sondages
            </Button>

            <Button
              variant="outlined"
              startIcon={<ShareOutlinedIcon />}
              onClick={handleShare}
              sx={{
                borderRadius: 2.5,
                py: 1.5,
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              Partager ce sondage
            </Button>

            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/')}
              sx={{
                borderRadius: 2.5,
                color: 'text.disabled',
                fontWeight: 500,
              }}
            >
              Retour à l&apos;accueil
            </Button>
          </Box>
        </Paper>
      </FadeIn>
    </Container>
  );
}
