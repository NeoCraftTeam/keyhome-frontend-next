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

interface SpeechResult {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechResultEvent {
  readonly results: {
    readonly [index: number]: { readonly [index: number]: SpeechResult };
  };
}

interface SpeechErrorEvent {
  readonly error: string;
  readonly message?: string;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
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
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if the SpeechRecognition constructor exists
    const hasApi =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    // Web Speech API requires HTTPS (except localhost)
    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      console.warn('[VoiceSearch] Web Speech API requires HTTPS in production');
    }

    setSupported(hasApi && isSecure);
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

    // Show immediate feedback (don't wait for browser mic permission)
    setState('listening');

    const SR: SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? // eslint-disable-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState('listening');

    rec.onresult = (e: SpeechResultEvent) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) {
        setState('processing');
        onTranscriptRef.current(transcript);
      }
      setState('idle');
    };

    rec.onerror = (e: SpeechErrorEvent) => {
      console.warn('[VoiceSearch] error:', e.error, e.message);

      // Handle different error types
      if (e.error === 'service-not-allowed' || e.error === 'not-allowed') {
        alert(
          'Microphone permission denied. Please enable microphone access in your browser settings.'
        );
        setSupported(false);
      } else if (e.error === 'network') {
        alert(
          'Network error. Voice search requires an internet connection and HTTPS.'
        );
      } else if (e.error === 'no-speech') {
        console.info('[VoiceSearch] No speech detected');
      } else if (e.error === 'audio-capture') {
        alert(
          'No microphone found. Please connect a microphone and try again.'
        );
        setSupported(false);
      } else if (e.error === 'aborted') {
        console.info('[VoiceSearch] Recording aborted by user');
      }

      setState('idle');
    };
    rec.onend = () => setState((s) => (s === 'listening' ? 'idle' : s));

    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn('[VoiceSearch] Failed to start:', err);
      setState('idle');
    }
  }, [supported, state, stop]);

  useEffect(
    () => () => {
      recRef.current?.stop();
    },
    []
  );

  if (!supported) return null;

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  // SKILL.md: touch targets must be ≥ 44×44px. The visual icon uses `size`
  // but the hit area is always at least 44px for mobile accessibility.
  const hitArea = Math.max(size, 44);

  return (
    <Tooltip title={isListening ? 'Arrêter' : 'Recherche vocale (fr)'}>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          mx: hitArea > size ? `-${(hitArea - size) / 2}px` : 0,
        }}
      >
        {/* Animated beat effect circles */}
        {isListening && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: hitArea,
                height: hitArea,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'error.main',
                opacity: 0.6,
                '@keyframes ripple1': {
                  '0%': {
                    transform: 'translate(-50%, -50%) scale(0.8)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'translate(-50%, -50%) scale(1.8)',
                    opacity: 0,
                  },
                },
                animation: 'ripple1 1.5s ease-out infinite',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: hitArea,
                height: hitArea,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'error.main',
                opacity: 0.6,
                '@keyframes ripple2': {
                  '0%': {
                    transform: 'translate(-50%, -50%) scale(0.8)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'translate(-50%, -50%) scale(1.8)',
                    opacity: 0,
                  },
                },
                animation: 'ripple2 1.5s ease-out infinite 0.5s',
              }}
            />
          </>
        )}

        <Box
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={
            isListening
              ? 'Arrêter la recherche vocale'
              : 'Lancer la recherche vocale'
          }
          aria-pressed={isListening}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) toggle();
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              e.stopPropagation();
              toggle();
            }
          }}
          sx={{
            // Visual size from prop, but hit area ≥ 44px (SKILL.md touch target)
            width: hitArea,
            height: hitArea,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'default' : 'pointer',
            color: isListening ? 'error.main' : 'text.secondary',
            transition: 'color 0.2s, background-color 0.2s, transform 0.2s',
            bgcolor: isListening ? 'rgba(246,71,95,0.15)' : 'transparent',
            position: 'relative',
            zIndex: 1,
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
            },
            animation: isListening ? 'pulse 0.8s ease-in-out infinite' : 'none',
            // Touch feedback (SKILL.md: ripple/highlight on tap)
            '&:active': disabled
              ? {}
              : { bgcolor: 'rgba(246,71,95,0.2)', transform: 'scale(0.92)' },
            '&:hover': disabled
              ? {}
              : {
                  color: isListening ? 'error.dark' : 'primary.main',
                  bgcolor: isListening ? 'rgba(246,71,95,0.2)' : 'action.hover',
                },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          {isProcessing ? (
            <CircularProgress
              size={size * 0.55}
              sx={{ color: 'primary.main' }}
            />
          ) : isListening ? (
            <StopIcon sx={{ fontSize: size * 0.6, color: 'error.main' }} />
          ) : (
            <MicIcon sx={{ fontSize: size * 0.6 }} />
          )}
        </Box>
      </Box>
    </Tooltip>
  );
}
