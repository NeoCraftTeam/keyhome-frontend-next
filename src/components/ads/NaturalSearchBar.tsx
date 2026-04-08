'use client';

import api from '@/lib/api';
import { buildNlpParams } from '@/lib/nlp-search';
import ImageSearchButton, {
  type ParsedSearchParams,
} from '@/components/search/ImageSearchButton';
import VoiceSearchButton from '@/components/search/VoiceSearchButton';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Search from '@mui/icons-material/Search';
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { motion, useAnimation } from 'framer-motion';

const EXAMPLES = [
  'Appartement 3 pièces à Bastos moins de 150 000 FCFA',
  'Villa avec piscine à Douala Bonapriso',
  'Studio meublé à Yaoundé avec parking',
  'Maison 4 chambres à Abidjan Cocody',
];

export default function NaturalSearchBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxControls = useAnimation();
  const prevLen = useRef(0);

  useEffect(() => {
    const len = query.length;
    const prev = prevLen.current;
    prevLen.current = len;

    if (len === 0) {
      setIsMultiline(false);
      return;
    }

    const el = inputRef.current;
    if (!isMultiline && el && el.scrollWidth > el.clientWidth) {
      setIsMultiline(true);
      void boxControls.start({
        y: [0, -9, 4, -2, 0],
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    } else if (prev === 0) {
      void boxControls.start({
        y: [0, -7, 3, -1.5, 0],
        transition: { duration: 0.55, ease: 'easeOut' },
      });
    }
  }, [query, boxControls, isMultiline]);

  const navigateFromParsed = useCallback(
    (parsed: ParsedSearchParams) => {
      startTransition(() =>
        router.push(`/search?${buildNlpParams(parsed).toString()}`)
      );
    },
    [router, startTransition]
  );

  const handleSearch = async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/search/parse', { q: searchQuery });
      navigateFromParsed(res.data as ParsedSearchParams);
    } catch {
      setError('Impossible de traiter votre recherche. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = useCallback(
    (transcript: string) => {
      setQuery(transcript);
      void handleSearch(transcript);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Box>
      <motion.div animate={boxControls} style={{ width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: isMultiline ? 'flex-start' : 'center',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            '&:focus-within': {
              boxShadow: (theme) => `0 0 0 4px ${theme.palette.primary.main}22`,
            },
          }}
        >
          <TextField
            fullWidth
            multiline={isMultiline}
            maxRows={isMultiline ? 4 : undefined}
            inputRef={inputRef}
            placeholder="Décrivez votre bien idéal en français..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={[
                    { pl: 2 },
                    isMultiline && { alignSelf: 'flex-start', pt: '18px' },
                  ]}
                >
                  <AutoAwesome color="primary" sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={[
                    { pr: 1, display: 'flex', alignItems: 'center', gap: 0.25 },
                    isMultiline && { alignSelf: 'flex-start', pt: '10px' },
                  ]}
                >
                  {!isLoading && (
                    <>
                      <VoiceSearchButton
                        onTranscript={handleVoice}
                        disabled={isLoading}
                        size={30}
                      />
                      <ImageSearchButton
                        onResult={navigateFromParsed}
                        onError={setError}
                        disabled={isLoading}
                        size={30}
                      />
                    </>
                  )}
                  {isLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Tooltip title="Rechercher">
                      <Box
                        onClick={() => handleSearch()}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <Search sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    </Tooltip>
                  )}
                </InputAdornment>
              ),
              sx: { px: 1, py: 1.5, fontSize: 16 },
            }}
          />
        </Paper>
      </motion.div>

      {error && (
        <Typography variant="caption" color="error" mt={1} display="block">
          {error}
        </Typography>
      )}

      {/* Example chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ alignSelf: 'center', mr: 0.5 }}
        >
          Essayez :
        </Typography>
        {EXAMPLES.map((ex) => (
          <Chip
            key={ex}
            label={ex}
            size="small"
            variant="outlined"
            onClick={() => {
              setQuery(ex);
              handleSearch(ex);
            }}
            sx={{ cursor: 'pointer', fontSize: 11 }}
          />
        ))}
      </Box>
    </Box>
  );
}
