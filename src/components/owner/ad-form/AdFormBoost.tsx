import { RocketLaunch as BoostIcon } from '@mui/icons-material';
import { Box, Paper, Switch, Typography } from '@mui/material';
import { brand } from '@/theme/tokens';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx } from './types';

interface AdFormBoostProps {
  values: AdFormValues;
  update: UpdateFn;
}

export default function AdFormBoost({ values, update }: AdFormBoostProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...sectionSx,
        border: '2px solid',
        borderColor: 'rgba(246, 71, 95, 0.2)',
        bgcolor: 'rgba(246, 71, 95, 0.02)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <BoostIcon sx={{ color: brand.primary }} />
        <Typography variant="subtitle1" fontWeight={800} color={brand.primary}>
          Booster cette annonce (Recommandé)
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Positionnez votre annonce en tête des résultats dès sa publication pour attirer 3x plus de locataires.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="body1" fontWeight={700}>Activer le Boost Standard</Typography>
          <Typography variant="caption" color="text.secondary">Remontée quotidienne pendant 3 jours · 1 500 FCFA</Typography>
        </Box>
        <Switch
          color="primary"
          checked={values.is_boost_requested || false}
          onChange={(e) => update('is_boost_requested', e.target.checked)}
        />
      </Box>
    </Paper>
  );
}
