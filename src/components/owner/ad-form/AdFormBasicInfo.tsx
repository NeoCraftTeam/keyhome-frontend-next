import { AutoAwesome as AiIcon, Home as HomeIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormBasicInfoProps {
  values: AdFormValues;
  update: UpdateFn;
  errors: Record<string, string>;
  enhancing: boolean;
  onEnhance: (() => Promise<void>) | null;
}

export default function AdFormBasicInfo({ values, update, errors, enhancing, onEnhance }: AdFormBasicInfoProps) {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Informations principales
      </Typography>
      <TextField
        fullWidth
        label="Titre de l'annonce"
        placeholder="Ex: Appartement 3 pièces vue mer — Bonanjo"
        value={values.title}
        onChange={(e) => update('title', e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        sx={{ mb: 2 }}
      />
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={4}
          placeholder="Décrivez votre bien en détail : état, environnement, commodités à proximité…"
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          error={!!errors.description}
          helperText={errors.description}
        />
        {onEnhance && (
          <Button
            size="small"
            startIcon={enhancing ? <CircularProgress size={16} /> : <AiIcon />}
            onClick={onEnhance}
            disabled={!values.description.trim() || enhancing}
            sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Améliorer avec l&apos;IA
          </Button>
        )}
      </Box>
    </Paper>
  );
}
