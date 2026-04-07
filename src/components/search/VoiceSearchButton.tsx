'use client';

import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  /** Size of the icon button — defaults to 32 */
  size?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((e: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export default function VoiceSearchButton({
  onTranscript,
  disabled,
  size = 32,
}: Props) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>(
    'idle'
  );
  const recRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setState('idle');
  }, []);

  const toggle = useCallback(() => {
    if (!supported) return;

    if (state === 'listening') {
      stop();
      return;
    }

    const SR: SpeechRecognitionCtor =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState('listening');

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      setState('processing');
      onTranscript(transcript);
      setState('idle');
    };

    rec.onerror = () => setState('idle');
    rec.onend = () => setState((s) => (s === 'listening' ? 'idle' : s));

    recRef.current = rec;
    rec.start();
  }, [supported, state, stop, onTranscript]);

  useEffect(
    () => () => {
      recRef.current?.stop();
    },
    []
  );

  if (!supported) return null;

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <Tooltip title={isListening ? 'Arrêter' : 'Recherche vocale (fr)'}>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={
          isListening
            ? 'Arrêter la recherche vocale'
            : 'Lancer la recherche vocale'
        }
        aria-pressed={isListening}
        onClick={disabled ? undefined : toggle}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggle();
          }
        }}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          color: isListening ? 'error.main' : 'text.secondary',
          transition: 'color 0.2s, transform 0.2s',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.15)', opacity: 0.8 },
          },
          animation: isListening ? 'pulse 1.2s ease-in-out infinite' : 'none',
          '&:hover': disabled
            ? {}
            : { color: isListening ? 'error.dark' : 'primary.main' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        {isProcessing ? (
          <CircularProgress size={size * 0.55} sx={{ color: 'primary.main' }} />
        ) : isListening ? (
          <StopIcon sx={{ fontSize: size * 0.6 }} />
        ) : (
          <MicIcon sx={{ fontSize: size * 0.6 }} />
        )}
      </Box>
    </Tooltip>
  );
}
