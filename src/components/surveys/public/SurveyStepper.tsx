'use client';

import { PublicSurvey, SurveyAnswerPayload } from '@/types';
import { Box, Button, CircularProgress, LinearProgress, Typography, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import PublicQuestionRenderer from './PublicQuestionRenderer';

interface SurveyStepperProps {
  survey: PublicSurvey;
  onSubmit: (answers: SurveyAnswerPayload[]) => void;
  isSubmitting: boolean;
}

const slideVariants = {
  enterFromRight: { opacity: 0, x: 40 },
  enterFromLeft: { opacity: 0, x: -40 },
  center: { opacity: 1, x: 0 },
  exitToLeft: { opacity: 0, x: -40 },
  exitToRight: { opacity: 0, x: 40 },
};

export default function SurveyStepper({ survey, onSubmit, isSubmitting }: SurveyStepperProps) {
  const questions = survey.questions;
  const totalSteps = questions.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id] ?? null;
  const progress = ((currentStep) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  const isAnswered = () => {
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    if (typeof currentAnswer === 'string') return currentAnswer.trim().length > 0;
    if (typeof currentAnswer === 'number') return currentAnswer > 0;
    return false;
  };

  const goNext = () => {
    if (!isAnswered()) return;
    setDirection('forward');
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection('back');
    setCurrentStep((s) => s - 1);
  };

  const handleSubmit = () => {
    const payload: SurveyAnswerPayload[] = Object.entries(answers).map(([question_id, answer]) => ({
      question_id,
      answer,
    }));
    onSubmit(payload);
  };

  return (
    <Box>
      {/* ── Progress bar + step counter ── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Question {currentStep + 1} sur {totalSteps}
          </Typography>
          <Typography variant="caption" fontWeight={700} color="primary.main">
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(246,71,95,0.10)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: 'linear-gradient(90deg, #F6475F 0%, #D93A50 100%)',
              transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
            },
          }}
        />

        {/* Step dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 2 }}>
          {questions.map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 6,
                width: i === currentStep ? 20 : 6,
                borderRadius: 3,
                bgcolor: i < currentStep
                  ? 'primary.main'
                  : i === currentStep
                  ? 'primary.main'
                  : 'rgba(0,0,0,0.10)',
                opacity: i === currentStep ? 1 : i < currentStep ? 0.5 : 0.3,
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── Question card with animated slide ── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: 280,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={direction === 'forward' ? slideVariants.enterFromRight : slideVariants.enterFromLeft}
            animate={slideVariants.center}
            exit={direction === 'forward' ? slideVariants.exitToLeft : slideVariants.exitToRight}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box sx={{ p: { xs: 3, md: 5 } }}>
              {/* Question number badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 100%)',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(246,71,95,0.25)',
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
                  {currentStep + 1}
                </Typography>
              </Box>

              {/* Question text */}
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ mb: 3.5, lineHeight: 1.4, letterSpacing: '-0.01em' }}
              >
                {currentQuestion.text}
              </Typography>

              {/* Answer input */}
              <PublicQuestionRenderer
                question={currentQuestion}
                value={currentAnswer}
                onChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }))
                }
              />
            </Box>
          </motion.div>
        </AnimatePresence>
      </Paper>

      {/* ── Navigation buttons ── */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          justifyContent: currentStep > 0 ? 'space-between' : 'flex-end',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {currentStep > 0 && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{
              borderRadius: 2.5,
              px: 3,
              py: 1.25,
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
            }}
          >
            Précédent
          </Button>
        )}

        {isLastStep ? (
          <Button
            variant="contained"
            endIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={!isAnswered() || isSubmitting}
            size="large"
            sx={{
              borderRadius: 2.5,
              px: 5,
              py: 1.25,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 100%)',
              boxShadow: '0 6px 20px rgba(246,71,95,0.30)',
              '&:hover': { boxShadow: '0 8px 28px rgba(246,71,95,0.40)', transform: 'translateY(-1px)' },
              '&:disabled': { background: '#E5E7EB', boxShadow: 'none' },
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {isSubmitting ? 'Envoi…' : 'Envoyer mes réponses'}
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={goNext}
            disabled={!isAnswered()}
            size="large"
            sx={{
              borderRadius: 2.5,
              px: 4,
              py: 1.25,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 100%)',
              boxShadow: '0 6px 20px rgba(246,71,95,0.30)',
              '&:hover': { boxShadow: '0 8px 28px rgba(246,71,95,0.40)', transform: 'translateY(-1px)' },
              '&:disabled': { background: '#E5E7EB', boxShadow: 'none' },
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Suivant
          </Button>
        )}
      </Box>
    </Box>
  );
}
