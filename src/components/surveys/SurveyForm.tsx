'use client';

import { Survey, SurveyAnswerPayload } from '@/types';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import QuestionRenderer from './QuestionRenderer';

interface SurveyFormProps {
  survey: Survey;
  onSubmit: (answers: SurveyAnswerPayload[]) => void;
  isSubmitting: boolean;
}

export default function SurveyForm({ survey, onSubmit, isSubmitting }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SurveyAnswerPayload[] = Object.entries(answers).map(([question_id, answer]) => ({
      question_id,
      answer,
    }));
    onSubmit(payload);
  };

  const isFormValid = survey.questions.every((q) => {
    const answer = answers[q.id];
    if (q.type === 'checkbox') return Array.isArray(answer) && answer.length > 0;
    return answer !== undefined && answer !== '' && answer !== null;
  });

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h4" fontWeight={800} gutterBottom className="aura-gradient-text">
        {survey.title}
      </Typography>
      {survey.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.6 }}>
          {survey.description}
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        {survey.questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(val) => handleAnswerChange(question.id, val)}
          />
        ))}
      </Box>

      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || isSubmitting}
          size="large"
          sx={{
            borderRadius: 3,
            px: 6,
            py: 1.5,
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(246, 71, 95, 0.25)',
          }}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer mes réponses'}
        </Button>
      </Box>
    </Paper>
  );
}
