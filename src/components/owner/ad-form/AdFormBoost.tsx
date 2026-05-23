import BoostIcon from '@mui/icons-material/RocketLaunch';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { brandAgent } from '@/theme/tokens';
import { sectionSx } from './types';

export default function AdFormBoost() {
  return (
    <Paper
      elevation={0}
      sx={{
        ...sectionSx,
        border: '2px solid',
        borderColor: alpha(brandAgent.primary, 0.2),
        bgcolor: alpha(brandAgent.primary, 0.02),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <BoostIcon sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle1" fontWeight={800} color="primary.main">
          Booster cette annonce (optionnel)
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Le boost se paie directement après la publication de votre annonce —
        Mobile Money, carte bancaire ou Orange Money. Aucun pack de crédits
        n&apos;est nécessaire côté bailleur.
      </Typography>

      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Une fois l&apos;annonce publiée, ouvrez <strong>Mes annonces</strong>,
        menu <strong>⋮</strong>, puis <strong>Booster cette annonce</strong>.
        Vous choisissez un plan et payez directement.
      </Alert>
    </Paper>
  );
}
