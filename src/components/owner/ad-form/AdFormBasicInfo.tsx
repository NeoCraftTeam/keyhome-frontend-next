import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { Button } from '@/components/ui/forms/Button';
import { TextField } from '@/components/ui/forms/TextField';
import { Typography } from '@/components/ui/typography/Typography';
import AiIcon from '@mui/icons-material/AutoAwesome';
import HomeIcon from '@mui/icons-material/Home';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, Paper, Tooltip } from '@mui/material';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormBasicInfoProps {
  values: AdFormValues;
  update: UpdateFn;
  errors: Record<string, string>;
  enhancing: boolean;
  enhancingTitle: boolean;
  generating: boolean;
  isStreaming?: boolean;
  streamedText?: string;
  originalDescription: string | null;
  originalTitle: string | null;
  onEnhance: (() => Promise<void>) | null;
  onGenerate: (() => Promise<void>) | null;
  onEnhanceTitle: (() => Promise<void>) | null;
  onRestoreDescription: (() => void) | null;
  onRestoreTitle: (() => void) | null;
}

export default function AdFormBasicInfo({
  values,
  update,
  errors,
  enhancing,
  enhancingTitle,
  generating,
  isStreaming = false,
  streamedText = '',
  originalDescription,
  originalTitle,
  onEnhance,
  onGenerate,
  onEnhanceTitle,
  onRestoreDescription,
  onRestoreTitle,
}: AdFormBasicInfoProps) {
  const descriptionIsEmpty = !values.description.trim();

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography
        variant="h6"
        sx={{
          ...sectionTitleSx,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '1.125rem',
        }}
      >
        <HomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Informations principales
      </Typography>

      {/* ── Titre ── */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <TextField
          fullWidth
          label="Titre de l'annonce"
          placeholder="Ex: Appartement 3 pièces vue mer — Bonanjo"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          {onEnhanceTitle && values.title.trim() && (
            <Button
              size="small"
              variant="text"
              color="primary"
              startIcon={
                enhancingTitle ? <ButtonSpinner size={14} /> : <AiIcon />
              }
              onClick={onEnhanceTitle}
              disabled={enhancingTitle}
              sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
            >
              Améliorer le titre
            </Button>
          )}
          {onRestoreTitle && originalTitle !== null && (
            <Tooltip title="Revenir au titre original">
              <Button
                size="small"
                variant="text"
                color="inherit"
                startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                onClick={onRestoreTitle}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1,
                  color: 'text.secondary',
                }}
              >
                Annuler
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Description ── */}
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={4}
          placeholder="Décrivez votre bien en détail : état, environnement, commodités à proximité…"
          value={isStreaming ? streamedText : values.description}
          onChange={(e) => {
            if (!isStreaming) update('description', e.target.value);
          }}
          error={!!errors.description}
          helperText={errors.description}
          slotProps={{
            input: {
              readOnly: isStreaming,
              sx: isStreaming
                ? {
                    background:
                      'linear-gradient(90deg, rgba(246,71,95,0.04) 0%, transparent 100%)',
                    animation: 'khPulse 1.5s ease-in-out infinite',
                    '@keyframes khPulse': {
                      '0%,100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }
                : undefined,
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          {onEnhance && !descriptionIsEmpty && (
            <Button
              size="small"
              variant="text"
              color="primary"
              startIcon={enhancing ? <ButtonSpinner size={14} /> : <AiIcon />}
              onClick={onEnhance}
              disabled={enhancing}
              sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
            >
              Améliorer avec l&apos;IA
            </Button>
          )}
          {onGenerate && descriptionIsEmpty && (
            <Button
              size="small"
              variant="text"
              color="primary"
              startIcon={generating ? <ButtonSpinner size={14} /> : <AiIcon />}
              onClick={onGenerate}
              disabled={generating}
              sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
            >
              Générer une description ✨
            </Button>
          )}
          {onRestoreDescription && originalDescription !== null && (
            <Tooltip title="Revenir à la description originale">
              <Button
                size="small"
                variant="text"
                color="inherit"
                startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                onClick={onRestoreDescription}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1,
                  color: 'text.secondary',
                }}
              >
                Annuler
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
