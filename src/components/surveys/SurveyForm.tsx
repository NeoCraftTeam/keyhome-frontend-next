'use client';

import { Survey, SurveyAnswerPayload } from '@/types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import QuestionRenderer from './QuestionRenderer';

interface SurveyFormProps {
  survey: Survey;
  onSubmit: (answers: SurveyAnswerPayload[], anonymous: boolean) => void;
  isSubmitting: boolean;
  /** Accent colour for buttons and progress bar (owner = teal, client = theme primary). */
  accentColor?: string;
}

export default function SurveyForm({
  survey,
  onSubmit,
  isSubmitting,
  accentColor,
}: SurveyFormProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string | number | string[]>
  >({});
  const [anonymous, setAnonymous] = useState(false);

  const total = survey.questions.length;
  const question = survey.questions[step];
  const isLast = step === total - 1;
  const progressPct = (step / total) * 100;

  const currentAnswer = answers[question?.id ?? ''];
  const isStepAnswered = (() => {
    if (!question) return false;
    const a = answers[question.id];
    if (question.type === 'checkbox') return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== '' && a !== null;
  })();

  const handleAnswerChange = (
    questionId: string,
    value: string | number | string[]
  ) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (step < total - 1) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    const payload: SurveyAnswerPayload[] = Object.entries(answers).map(
      ([question_id, answer]) => ({ question_id, answer })
    );
    onSubmit(payload, anonymous);
  };

  const btnSx = accentColor
    ? {
        bgcolor: accentColor,
        '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)' },
        '&:disabled': { bgcolor: `${accentColor}60` },
      }
    : {};

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* ── Progress bar ── */}
      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: 'divider',
          '& .MuiLinearProgress-bar': {
            bgcolor: accentColor ?? 'primary.main',
            transition: 'transform 0.4s ease',
          },
        }}
      />

      {/* ── Header ── */}
      <Box sx={{ px: { xs: 3, md: 8 }, pt: 3, pb: 1, flexShrink: 0 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ color: accentColor ?? 'primary.main', letterSpacing: 1 }}
        >
          QUESTION {step + 1} / {total}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {survey.title}
        </Typography>
        {survey.description && step === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, lineHeight: 1.5 }}
          >
            {survey.description}
          </Typography>
        )}
      </Box>

      {/* ── Question area (fills remaining height) ── */}
      <Box
        key={question?.id}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, md: 8 },
          py: 2,
          overflow: 'hidden',
          animation: 'kh-q-in 0.22s ease both',
          '@keyframes kh-q-in': {
            '0%': { opacity: 0, transform: 'translateX(16px)' },
            '100%': { opacity: 1, transform: 'translateX(0)' },
          },
        }}
      >
        <QuestionRenderer
          question={question}
          value={currentAnswer}
          onChange={(val) => handleAnswerChange(question.id, val)}
        />
      </Box>

      {/* ── Footer navigation ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 3, md: 8 },
          pb: { xs: 3, md: 4 },
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Anonymous toggle — only on last step */}
        {isLast && (
          <Tooltip
            title="Vos réponses seront envoyées sans être liées à votre compte."
            arrow
            placement="top"
          >
            <FormControlLabel
              control={
                <Switch
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  size="small"
                  sx={
                    accentColor
                      ? {
                          '& .MuiSwitch-thumb': {
                            bgcolor: anonymous ? accentColor : undefined,
                          },
                          '& .Mui-checked + .MuiSwitch-track': {
                            bgcolor: `${accentColor}80`,
                          },
                        }
                      : {}
                  }
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VisibilityOff
                    sx={{
                      fontSize: 16,
                      color: anonymous ? 'text.primary' : 'text.disabled',
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={anonymous ? 'text.primary' : 'text.secondary'}
                    fontWeight={500}
                  >
                    Répondre anonymement
                  </Typography>
                </Box>
              }
              sx={{ m: 0, mb: 2 }}
            />
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Previous */}
          {step > 0 ? (
            <Button
              variant="outlined"
              onClick={handlePrev}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 3, fontWeight: 600, px: 3 }}
            >
              Précédent
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ flex: 1 }} />

          {/* Next / Submit */}
          {!isLast ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepAnswered}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 3, fontWeight: 700, px: 4, ...btnSx }}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isStepAnswered || isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{ borderRadius: 3, fontWeight: 700, px: 4, ...btnSx }}
            >
              {isSubmitting ? 'Envoi…' : 'Envoyer mes réponses'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
