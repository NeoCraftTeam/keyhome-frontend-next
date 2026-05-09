'use client';

import {
  buildEmptySearchCopilotMessage,
  getRelaxSuggestions,
  shouldSuggestRefine,
  type RelaxActionId,
  type RelaxSuggestion,
  type SearchFilterSnapshot,
} from '@/lib/search-guidance';
import {
  Button,
  Chip,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { radius, shadow } from '@/theme/tokens';

interface SearchCopilotEmptyAssistProps {
  snapshot: SearchFilterSnapshot;
  onRelax: (id: RelaxActionId) => void;
}

/**
 * Rule-based guidance when the search returns zero rows — no LLM, actions map to real filters.
 */
export function SearchCopilotEmptyAssist({
  snapshot,
  onRelax,
}: SearchCopilotEmptyAssistProps) {
  const message = buildEmptySearchCopilotMessage(snapshot);
  const suggestions = getRelaxSuggestions(snapshot);

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: 560,
        mx: 'auto',
        mb: 2,
        p: { xs: 2, sm: 2.5 },
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: shadow.card,
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          letterSpacing: '0.08em',
          color: 'text.secondary',
          fontWeight: 700,
          mb: 0.75,
        }}
      >
        Recherche
      </Typography>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
      >
        Affiner vos critères
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.65, mb: suggestions.length > 0 ? 1.75 : 0 }}
      >
        {message}
      </Typography>
      {suggestions.length > 0 ? (
        <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
          {suggestions.map((s: RelaxSuggestion) => (
            <Chip
              key={s.id}
              label={s.label}
              size="small"
              onClick={() => onRelax(s.id)}
              variant="outlined"
              sx={{
                fontWeight: 600,
                borderRadius: `${radius.sm}px`,
                borderColor: 'divider',
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                  borderColor: 'text.disabled',
                },
                '&:focus-visible': { outlineOffset: 2 },
              }}
            />
          ))}
        </Stack>
      ) : null}
    </Paper>
  );
}

interface SearchCopilotResultsAssistProps {
  total: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

/**
 * When the result set is large but filters are still loose — nudge to open filters (no duplicate listing rows).
 */
export function SearchCopilotResultsAssist({
  total,
  activeFilterCount,
  onOpenFilters,
}: SearchCopilotResultsAssistProps) {
  if (!shouldSuggestRefine(total, activeFilterCount)) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      component="section"
      aria-label="Suggestion pour affiner une recherche avec de nombreux résultats"
      sx={{
        mb: 2,
        p: { xs: 1.5, sm: 2 },
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: shadow.card,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          letterSpacing: '0.08em',
          color: 'text.secondary',
          fontWeight: 700,
          lineHeight: 1.2,
          mb: 0.25,
        }}
        component="p"
      >
        Résultats
      </Typography>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 1.25 }}
      >
        Affiner votre recherche
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.5, lineHeight: 1.6 }}
      >
        Nombreuses annonces ({total.toLocaleString('fr-FR')}) avec peu de
        filtres actifs.{' '}
        <MuiLink
          component="button"
          type="button"
          onClick={onOpenFilters}
          sx={{
            fontWeight: 700,
            verticalAlign: 'baseline',
            cursor: 'pointer',
            color: 'primary.dark',
            textDecorationColor: 'rgba(246, 71, 95, 0.35)',
          }}
        >
          Ouvrir les filtres
        </MuiLink>{' '}
        pour cibler plus précisément.
      </Typography>

      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={onOpenFilters}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: `${radius.sm}px`,
        }}
      >
        Affiner les critères
      </Button>
    </Paper>
  );
}
